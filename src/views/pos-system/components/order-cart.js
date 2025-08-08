import React, { useEffect, useState } from 'react';
import {
  CheckOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Form, Image, Input, Row, Space, Spin } from 'antd';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  addToCart,
  clearCart,
  removeFromCart,
  reduceCart,
  setCartShops,
  clearCartShops,
  setCartTotal,
  addCoupon,
  verifyCoupon,
  removeBag,
  setCartData,
  setCartOrder,
  addOrderNotes,
} from 'redux/slices/cart';
import shopService from 'services/shop';
import getImage from 'helpers/getImage';
import useDidUpdate from 'helpers/useDidUpdate';
import orderService from 'services/order';
import invokableService from 'services/rest/invokable';
import { useTranslation } from 'react-i18next';
import numberToPrice from 'helpers/numberToPrice';
import { getCartData, getCartItems } from 'redux/selectors/cartSelector';
import PreviewInfo from '../../order/preview-info';
import { toast } from 'react-toastify';
import { fetchRestProducts } from 'redux/slices/product';
import useDebounce from 'helpers/useDebounce';
import transactionService from 'services/transaction';
import moment from 'moment';
import QueryString from 'qs';

export default function OrderCart() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { cartItems, cartShops, currentBag, total, coupons, currency, notes } =
    useSelector((state) => state.cart, shallowEqual);
  const filteredCartItems = useSelector((state) => getCartItems(state.cart));
  const data = useSelector((state) => getCartData(state.cart));
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [loadingCoupon, setLoadingCoupon] = useState(null);
  const [couponField, setCouponField] = useState('');
  const debouncedCartItems = useDebounce(cartItems, 300);
  const cartData = useSelector((state) => getCartData(state.cart));

  const deleteCard = (e) => dispatch(removeFromCart(e));

  const clearAll = () => {
    dispatch(clearCart());
    if (currentBag !== 0) {
      dispatch(removeBag(currentBag));
    }
  };

  const increment = (item) => {
    if (item.quantity === item?.stockID?.quantity) {
      return;
    }
    if (item.quantity === item.max_qty) {
      return;
    }
    dispatch(addToCart({ ...item, quantity: 1 }));
  };

  const decrement = (item) => {
    if (item.quantity === 1) {
      return;
    }
    if (item.quantity <= item.min_qty) {
      return;
    }
    dispatch(reduceCart({ ...item, quantity: 1 }));
  };

  function getShops() {
    shopService.getById(data?.shop?.value).then((res) => setShops(res.data));
  }

  useEffect(() => {
    if (data?.shop?.value) {
      getShops();
    }
  }, []);

  function formatProducts(list) {
    const products = list.map((item) => ({
      quantity: item.quantity,
      stock_id: item.stockID ? item.stockID?.id : item.stock?.id,
    }));

    const result = {
      products,
      currency_id: currency?.id,
      coupon: data?.coupon?.coupon,
      delivery_type: data?.deliveries?.label?.toLowerCase(),
      delivery_point_id:
        data?.delivery_type === 0 ? data?.delivery_point?.value : undefined,
      delivery_price_id:
        data?.delivery_type === 1 ? data?.delivery_price_id : undefined,
    };
    return QueryString.stringify(result, { addQueryPrefix: true });
  }

  useDidUpdate(() => {
    dispatch(
      fetchRestProducts({
        perPage: 12,
        currency_id: currency?.id,
        shop_id: data?.shop?.value,
        active: 1,
      }),
    );
    if (filteredCartItems.length) {
      productCalculate();
    }
  }, [currency]);

  useDidUpdate(() => {
    if (filteredCartItems.length) {
      productCalculate();
    } else {
      dispatch(clearCartShops());
    }
  }, [debouncedCartItems, currentBag, data?.address, currency, data?.coupon]);

  function productCalculate() {
    setLoading(true);

    const products = formatProducts(filteredCartItems);

    orderService
      .calculate(products)
      .then(({ data }) => {
        const items = data?.shops
          ?.flatMap((shop) => shop.stocks)
          ?.map((item) => ({
            ...filteredCartItems.find((el) => el.id === item.id),
            ...item,
            ...item.stock.countable,
            stock: item.stock.stock_extras,
            stocks: item.stock.stock_extras,
            stockID: item.stock,
          }));

        const shopList = [{ ...shops, products: items }];

        const orderData = {
          product_total: data?.price,
          product_tax: data?.total_tax,
          shop_tax: data?.total_shop_tax,
          order_total: data?.total_price,
          delivery_fee: data?.delivery_fee,
          service_fee: data?.service_fee,
          discount: data?.total_discount,
          tax: data?.total_tax,
          coupon: data?.coupon_price,
        };
        batch(() => {
          dispatch(setCartShops(shopList));
          dispatch(setCartTotal(orderData));
        });
      })
      .finally(() => setLoading(false));
  }

  const handleSave = (id) => {
    setOrderId(id);
  };

  const handleCloseInvoice = () => {
    setOrderId(null);
    clearAll();
    toast.success(t('successfully.closed'));
    dispatch(
      fetchRestProducts({
        perPage: 12,
        currency_id: currency?.id,
        shop_id: cartData?.shop.value,
        active: 1,
      }),
    );
  };

  function handleCheckCoupon(shopId) {
    let coupon = coupons.find((item) => item.shop_id === shopId);
    if (!coupon) {
      return;
    }
    setLoadingCoupon(shopId);
    invokableService
      .checkCoupon(coupon)
      .then((res) => {
        dispatch(setCartData({ coupon, bag_id: currentBag }));
        dispatch(
          verifyCoupon({
            shop_id: shopId,
            price: res.data.price,
            verified: true,
          }),
        );
      })
      .catch(() =>
        dispatch(
          verifyCoupon({
            shop_id: shopId,
            price: 0,
            verified: false,
          }),
        ),
      )
      .finally(() => setLoadingCoupon(null));
  }

  function createTransaction(id, data) {
    transactionService
      .create(id, data)
      .then((res) => handleSave(res.data.id))
      .finally(() => setLoading(false));
  }

  const handleClick = () => {
    if (!currency) {
      toast.warning(t('please.select.currency'));
      return;
    }
    if (!data.address && data?.delivery_type === 1) {
      toast.warning(t('please.select.address'));
      return;
    }
    if (!data.country && data?.delivery_type === 1) {
      toast.warning(t('please.select.country'));
      return;
    }
    if (!data.street_house_number && data?.delivery_type === 1) {
      toast.warning(t('please.enter.house.number'));
      return;
    }
    if (!data.zip_code && data?.delivery_type === 1) {
      toast.warning(t('please.enter.zipcode'));
      return;
    }
    if (!data.delivery_point && data?.delivery_type === 0) {
      toast.warning(t('please.select.delivery.point'));
      return;
    }
    if (!data.delivery_time) {
      toast.warning(t('shop.closed'));
      return;
    }
    if (!data.delivery_date) {
      toast.warning(t('please.select.deliveryDate'));
      return;
    }
    setLoading(true);
    const products = cartItems?.map((cart) => ({
      stock_id: cart.stockID?.id,
      quantity: cart.quantity,
      bonus: cart.bonus,
      note: notes[cart.stockID?.id],
    }));
    const body = {
      user_id: data.user?.value,
      currency_id: currency?.id,
      rate: currency.rate,
      coupon: coupons[0]?.coupon,
      tax: total.order_tax,
      payment_type: data.paymentType?.label,
      delivery_point_id:
        data?.delivery_type === 0 ? data?.delivery_point?.value : undefined,
      delivery_price_id:
        data?.delivery_type === 1 ? data?.delivery_price_id : undefined,
      address:
        data?.delivery_type === 1
          ? {
              address: data.address?.address,
              country_id: data?.country?.value,
              city_id: data?.city?.value,
              street_house_number: data?.street_house_number,
              zip_code: data?.zip_code,
            }
          : undefined,
      location:
        data?.delivery_type === 1
          ? {
              latitude: data.address?.lat,
              longitude: data.address?.lng,
            }
          : undefined,
      delivery_date: `${data.delivery_date} ${moment(
        data.delivery_time,
        'HH:mm',
      ).format('HH:mm')}`,
      delivery_type: data.deliveries.label.toLowerCase(),
      products: products,
      phone: data?.phone?.toString(),
    };

    const payment = {
      payment_sys_id: data.paymentType.value,
    };

    orderService
      .create(body)
      .then((response) => {
        dispatch(setCartOrder(response.data));
        dispatch(clearCart());
        createTransaction(response.data.id, payment);
        form.resetFields();
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <Card>
      {loading && (
        <div className='loader'>
          <Spin />
        </div>
      )}
      <div className='card-save'>
        {cartShops?.map((shop, idx) => (
          <div key={shop.uuid + '_' + idx}>
            <div className='all-price'>
              <span className='title'>
                {shop?.translation?.title} {t('products')}
              </span>
              <span className='counter'>
                {shop?.products?.length}{' '}
                {shop?.products?.length > 1 ? t('products') : t('product')}
              </span>
            </div>
            {shop?.products?.map((item, index) =>
              item?.bonus !== true ? (
                <div
                  className='custom-cart-container'
                  key={item?.id + '_' + index}
                >
                  <Row className='product-row'>
                    <Image
                      width={70}
                      height='auto'
                      src={getImage(item?.img)}
                      preview
                      placeholder
                      className='rounded'
                    />
                    <Col span={18} className='product-col'>
                      <div>
                        <span className='product-name'>
                          {item?.translation?.title}
                        </span>
                        <br />
                        <Space wrap className='mt-2'>
                          {item?.stock?.map((el, idy) => {
                            if (el?.group?.type === 'color') {
                              return (
                                <Space>
                                  {t('color')}:
                                  <div
                                    className='extras-color'
                                    style={{
                                      backgroundColor: el?.value?.value,
                                    }}
                                  ></div>
                                </Space>
                              );
                            }
                            return (
                              <Space>
                                <span>{el?.group?.translation?.title}:</span>
                                <span
                                  key={idy + '-' + el.value?.value}
                                  className='extras-text rounded pr-2 pl-2'
                                >
                                  {el.value?.value}
                                </span>
                              </Space>
                            );
                          })}
                        </Space>
                        <br />
                        <Space wrap className='mt-2'>
                          {item?.addons?.map((addon, idk) => {
                            return (
                              <span
                                key={idk + '-' + addon?.quantity}
                                className='extras-text rounded pr-2 pl-2'
                              >
                                {addon?.countable?.translation?.title} x{' '}
                                {addon?.quantity}
                              </span>
                            );
                          })}
                        </Space>
                        <div className='product-counter'>
                          <span>
                            {numberToPrice(
                              item?.total_price || item?.price,
                              currency?.symbol,
                            )}
                          </span>

                          <div className='count'>
                            <Button
                              className='button-counter'
                              shape='circle'
                              icon={<MinusOutlined size={14} />}
                              onClick={() => decrement(item)}
                            />
                            <span>
                              {item?.quantity *
                                (item?.stock?.product?.interval || 1)}
                              {item?.stock?.product?.unit?.translation?.title}
                            </span>
                            <Button
                              className='button-counter'
                              shape='circle'
                              icon={<PlusOutlined size={14} />}
                              onClick={() => increment(item)}
                            />
                            <Button
                              className='button-counter'
                              shape='circle'
                              onClick={() => deleteCard(item)}
                              icon={<DeleteOutlined size={14} />}
                            />
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col span={24}>
                      <Input
                        placeholder={t('note')}
                        className='w-100 mt-2'
                        defaultValue={notes[item.stockID.id]}
                        onBlur={(event) =>
                          dispatch(
                            addOrderNotes({
                              label: item.stockID.id,
                              value: event.target.value || undefined,
                            }),
                          )
                        }
                      />
                    </Col>
                  </Row>
                </div>
              ) : (
                <>
                  <h4 className='mt-2'> {t('Bonus.product')} </h4>
                  <div
                    className='custom-cart-container'
                    key={item.id + '_' + index}
                  >
                    <Row className='product-row'>
                      <Image
                        width={70}
                        height='auto'
                        src={getImage(item?.img)}
                        preview
                        placeholder
                        className='rounded'
                      />
                      <Col span={18} className='product-col'>
                        <div>
                          <span className='product-name'>
                            {item?.translation?.title}
                          </span>
                          <br />
                          <Space wrap className='mt-2'>
                            {item?.stock?.map((el, idj) => {
                              if (el?.group?.type === 'color') {
                                return (
                                  <Space>
                                    {t('color')}:
                                    <div
                                      className='extras-color'
                                      style={{
                                        backgroundColor: el?.value?.value,
                                      }}
                                    ></div>
                                  </Space>
                                );
                              }
                              return (
                                <Space>
                                  <span>{el?.group?.translation?.title}:</span>
                                  <span
                                    key={idj + '-' + el.value?.value}
                                    className='extras-text rounded pr-2 pl-2'
                                  >
                                    {el.value?.value}
                                  </span>
                                </Space>
                              );
                            })}
                          </Space>
                          <br />
                          <Space wrap className='mt-2'>
                            {item.addons?.map((addon, idp) => {
                              return (
                                <span
                                  key={idp + '_' + addon?.quantity}
                                  className='extras-text rounded pr-2 pl-2'
                                >
                                  {addon?.countable?.translation?.title} x{' '}
                                  {addon?.quantity}
                                </span>
                              );
                            })}
                          </Space>
                          <div className='product-counter'>
                            <span>
                              {numberToPrice(
                                item?.total_price || item?.price,
                                currency?.symbol,
                              )}
                            </span>

                            <div className='count'>
                              <Button
                                className='button-counter'
                                shape='circle'
                                icon={<MinusOutlined size={14} />}
                                onClick={() => decrement(item)}
                                disabled
                              />
                              <span>
                                {item?.quantity *
                                  (item?.stock?.product?.interval || 1)}
                                {item?.stock?.product?.unit?.translation?.title}
                              </span>
                              <Button
                                className='button-counter'
                                shape='circle'
                                icon={<PlusOutlined size={14} />}
                                onClick={() => increment(item)}
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </>
              ),
            )}

            <div className='d-flex my-3'>
              <Input
                placeholder={t('coupon')}
                className='w-100 mr-2'
                addonAfter={
                  coupons.find((el) => el.shop_id === shop.id)?.verified ? (
                    <CheckOutlined style={{ color: '#18a695' }} />
                  ) : null
                }
                defaultValue={
                  coupons.find((el) => el.shop_id === shop.id)?.coupon
                }
                onBlur={(event) =>
                  dispatch(
                    addCoupon({
                      coupon: event.target.value,
                      user_id: data?.user?.value,
                      shop_id: shop.id,
                      verified: false,
                    }),
                  )
                }
                onChange={(event) => setCouponField(event.target.value)}
              />
              <Button
                disabled={
                  couponField.trim().length === 0 ||
                  couponField.trim().length < 2
                }
                onClick={() => handleCheckCoupon(shop.id)}
                loading={loadingCoupon === shop.id}
              >
                {t('check.coupon')}
              </Button>
            </div>
          </div>
        ))}

        <Row className='all-price-row'>
          <Col span={24} className='col'>
            <div className='all-price-container'>
              <span>{t('products')}</span>
              <span>
                {numberToPrice(total.product_total, currency?.symbol)}
              </span>
            </div>
            <div className='all-price-container'>
              <span>{t('delivery.fee')}</span>
              <span>{numberToPrice(total.delivery_fee, currency?.symbol)}</span>
            </div>
            <div className='all-price-container'>
              <span>{t('service.fee')}</span>
              <span>{numberToPrice(total.service_fee, currency?.symbol)}</span>
            </div>
            <div className='all-price-container'>
              <span>{t('tax')}</span>
              <span>{numberToPrice(total.tax, currency?.symbol)}</span>
            </div>
            <div className='all-price-container'>
              <span>{t('discount')}</span>
              <span>- {numberToPrice(total.discount, currency?.symbol)}</span>
            </div>
            <div className='all-price-container'>
              <span>{t('coupon')}</span>
              <span>- {numberToPrice(total.coupon, currency?.symbol)}</span>
            </div>
          </Col>
        </Row>

        <Row className='submit-row'>
          <Col span={14} className='col'>
            <span>{t('total.amount')}</span>
            <span>{numberToPrice(total.order_total, currency?.symbol)}</span>
          </Col>
          <Col className='col2'>
            <Button
              type='primary'
              onClick={() => handleClick()}
              disabled={!cartShops.length}
              loading={loading}
            >
              {t('place.order')}
            </Button>
          </Col>
        </Row>
      </div>
      {orderId ? (
        <PreviewInfo orderId={orderId} handleClose={handleCloseInvoice} />
      ) : (
        ''
      )}
    </Card>
  );
}
