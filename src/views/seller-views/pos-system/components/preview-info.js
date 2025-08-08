import React, { useEffect, useState } from 'react';
import { Button, Card, Modal, Space, Spin, Table, Tag } from 'antd';
import orderService from '../../../../services/seller/order';
import Column from 'antd/lib/table/Column';
import { PrinterOutlined } from '@ant-design/icons';
import moment from 'moment';
import numberToPrice from '../../../../helpers/numberToPrice';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import { GetColorName } from 'hex-color-to-color-name';

const PreviewInfo = ({ orderId, handleClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [list, setList] = useState([]);
  const { defaultLang } = useSelector((state) => state.formLang, shallowEqual);

  function fetchOrderDetails() {
    setLoading(true);
    orderService
      .getById(orderId)
      .then((res) => {
        setData(res.data);
        const items = res.data?.details
          ?.flatMap((detail) => detail.products)
          ?.map((item) => ({
            ...item,
            ...item.stock.extras,
            numberQuantity: item.quantity,
            numberTax: item.tax,
          }));
        setList(items);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, []);

  function calculateProductsPrice() {
    return data?.details.reduce(
      (total, item) => (total += item.total_price),
      0
    );
  }

  return (
    <Modal
      visible={!!orderId}
      title={`Order created successfully`}
      onOk={handleClose}
      onCancel={handleClose}
      footer={[
        <Button onClick={handleClose}>{t('back')}</Button>,
        <Button type='primary' onClick={() => window.print()}>
          <PrinterOutlined type='printer' />
          <span className='ml-1'>{t('print')}</span>
        </Button>,
      ]}
      style={{ minWidth: '80vw' }}
    >
      <div className='py-4'>
        {loading ? (
          <div className='w-100 text-center'>
            <Spin />
          </div>
        ) : (
          <Card
            title={`${t('order.details')} ${data?.id ? `#${data?.id}` : ''}`}
            className='order-details'
          >
            <div className='d-flex justify-content-between mt-3'>
              <div>
                <h2 className='mb-1 font-weight-semibold'>
                  {t('invoice')} #{data?.id}
                </h2>
                <p>{moment(data?.created_at).format('DD/M/YYYY')}</p>
                <address>
                  <p>
                    <span>
                      {t('delivery.type')}: {data?.delivery_type}
                    </span>
                    <br />
                    {data?.delivery_type === 'point' && (
                      <>
                        <span>
                          {t('point')}:{' '}
                          {data?.delivery_point?.address?.[defaultLang]}
                        </span>
                        <br />
                      </>
                    )}{' '}
                    {data?.delivery_type === 'delivery' && (
                      <>
                        <span>
                          {t('delivery.address')}: {data?.address?.address}
                        </span>
                        <br />
                      </>
                    )}
                    <span>
                      {t('delivery.date')}: {data?.delivery_date}{' '}
                      {data?.details[0]?.delivery_time}
                    </span>
                    <br />
                    <span>
                      {t('note')}: {data?.note}
                    </span>
                  </p>
                </address>
              </div>
              <address>
                <p>
                  <span className='font-weight-semibold text-dark font-size-md'>
                    {data?.user?.firstname} {data?.user?.lastname || ''}
                  </span>
                  <br />
                  <span>
                    {t('phone')}: {data?.phone}
                  </span>
                  <br />
                  <span>
                    {t('email')}: {data?.user?.email}
                  </span>
                </p>
              </address>
            </div>

            <div className='mt-4'>
              <Table
                scroll={{ x: true }}
                dataSource={list}
                pagination={false}
                className='mb-5'
              >
                <Column title='No.' dataIndex='id' key='id' />
                <Column
                  title='Product'
                  dataIndex='stock'
                  key='product'
                  render={(stock, row) => (
                    <Space wrap>
                      <span>{stock?.product?.translation?.title}</span>
                      {stock?.extras?.map((extra) =>
                        extra.group?.type === 'color' ? (
                          <Tag key={extra?.id}>
                            {extra.group?.translation?.title}:{' '}
                            {GetColorName(extra.value?.value)}
                          </Tag>
                        ) : (
                          <Tag key={extra?.id}>
                            {extra.group?.translation?.title}:{' '}
                            {extra.value?.value}
                          </Tag>
                        )
                      )}
                    </Space>
                  )}
                />
                <Column
                  title={t('quantity')}
                  dataIndex='numberQuantity'
                  key='numberQuantity'
                  render={(_, row) => (
                    <span>
                      {row.quantity * (row.stock?.product?.interval || 1)}
                      {row?.stock?.product?.unit?.translation?.title}
                    </span>
                  )}
                />

                <Column
                  title={t('discount')}
                  dataIndex='discount'
                  key='discount'
                  render={(discount = 0) =>
                    numberToPrice(discount, data?.currency?.symbol)
                  }
                />

                <Column
                  title={t('price')}
                  dataIndex='total_price'
                  key='total_price'
                  render={(total_price) =>
                    numberToPrice(total_price, data?.currency?.symbol)
                  }
                />
              </Table>
              <div className='d-flex justify-content-end'>
                <div className='text-right '>
                  <div className='border-bottom'>
                    <p className='mb-2'>
                      <span>{t('sub-total.amount')}: </span>
                      {numberToPrice(
                        calculateProductsPrice(),
                        data?.currency?.symbol
                      )}
                    </p>
                    <p>
                      {t('delivery.price')} :{' '}
                      {numberToPrice(
                        data?.delivery_fee,
                        data?.currency?.symbol
                      )}
                    </p>
                    <p>
                      {t('shop.tax')} :{' '}
                      {numberToPrice(data?.shop_tax, data?.currency?.symbol)}
                    </p>
                    <p>
                      {t('service.fee')} :{' '}
                      {numberToPrice(data?.service_fee, data?.currency?.symbol)}
                    </p>
                    <p>
                      {t('coupon')} :{' '}
                      {numberToPrice(
                        data?.coupon?.price,
                        data?.currency?.symbol
                      )}
                    </p>
                    {/* <p>
                      {t('coupon')} :{' '}
                      {numberToPrice(
                        data?.coupon?.price,
                        data?.currency?.symbol
                      )}
                    </p> */}
                  </div>
                  <h2 className='font-weight-semibold mt-3'>
                    <span className='mr-1'>{t('grand.total')}: </span>
                    {numberToPrice(data?.total_price, data?.currency?.symbol)}
                  </h2>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default PreviewInfo;
