import React, { useEffect, useState } from 'react';
import { Button, Card, Image, Modal, Space, Spin, Table, Tag } from 'antd';
import orderService from '../../services/order';
import { PrinterOutlined } from '@ant-design/icons';
import moment from 'moment';
import numberToPrice from '../../helpers/numberToPrice';
import { useTranslation } from 'react-i18next';
import 'assets/scss/components/print.scss';
import getImage from 'helpers/getImage';
import { shallowEqual, useSelector } from 'react-redux';
import { GetColorName } from 'hex-color-to-color-name';

const PreviewInfo = ({ orderId, handleClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [list, setList] = useState([]);
  const { defaultCurrency } = useSelector(
    (state) => state.currency,
    shallowEqual
  );

  const { defaultLang } = useSelector((state) => state.formLang, shallowEqual);

  function fetchOrderDetails() {
    setLoading(true);
    orderService
      .getById(orderId)
      .then((res) => {
        setData(res.data);

        setList(res.data?.details);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const expandedRowRender = (record) => {
    const columns = [
      {
        title: t('id'),
        dataIndex: 'id',
        key: 'id',
        render: (_, row) => row.stock?.id,
      },
      {
        title: t('product.name'),
        dataIndex: 'product',
        key: 'product',
        render: (_, row) => (
          <Space direction='vertical' className='relative'>
            {row.stock?.product?.translation?.title}
            {row.stock?.extras?.map((extra) =>
              extra.group?.type === 'color' ? (
                <Tag key={extra?.id}>
                  {extra.group?.translation?.title}:{' '}
                  {GetColorName(extra.value?.value)}
                </Tag>
              ) : (
                <Tag key={extra?.id}>
                  {extra.group?.translation?.title}: {extra.value?.value}
                </Tag>
              )
            )}
          </Space>
        ),
      },
      {
        title: t('image'),
        dataIndex: 'img',
        key: 'img',
        render: (_, row) => (
          <Image
            src={getImage(row.stock?.product?.img)}
            alt='product'
            width={100}
            height='auto'
            className='rounded'
            preview
            placeholder
          />
        ),
      },
      {
        title: t('price'),
        dataIndex: 'origin_price',
        key: 'origin_price',
        render: (origin_price) =>
          numberToPrice(origin_price, defaultCurrency?.symbol),
      },
      {
        title: t('quantity'),
        dataIndex: 'quantity',
        key: 'quantity',
        render: (text) => <span>{text}</span>,
      },
      {
        title: t('discount'),
        dataIndex: 'discount',
        key: 'discount',
        render: (discount = 0) =>
          numberToPrice(discount, defaultCurrency?.symbol),
      },
      {
        title: t('tax'),
        dataIndex: 'tax',
        key: 'tax',
        render: (tax) => numberToPrice(tax, defaultCurrency?.symbol),
      },
      {
        title: t('total.price'),
        dataIndex: 'total_price',
        key: 'total_price',
        render: (total_price, row) => {
          return numberToPrice(total_price, defaultCurrency?.symbol);
        },
      },
    ];
    const data = record?.products || [];

    return <Table columns={columns} dataSource={data} pagination={false} />;
  };

  const columns = [
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      render: (_, row) => row?.shop?.id,
    },
    {
      title: t('shop.name'),
      dataIndex: 'shop.name',
      key: 'shop.name',
      render: (_, row) => (
        <Space direction='vertical' className='relative'>
          {row?.shop.translation?.title}
        </Space>
      ),
    },
    {
      title: t('image'),
      dataIndex: 'shop.img',
      key: 'shop.img',
      render: (_, row) => (
        <Image
          src={getImage(row?.shop?.logo_img)}
          alt='product'
          width={100}
          height='auto'
          className='rounded'
          preview
          placeholder
        />
      ),
    },
    {
      title: t('Phone'),
      dataIndex: 'origin_price',
      key: 'shop.phone',
      render: (_, row) => {
        return <a href={`tel:${row?.shop?.phone}`}>{row?.shop?.phone}</a>;
      },
    },
    {
      title: t('tax'),
      dataIndex: 'tax',
      key: 'tax',
      render: (_, row) => row?.shop?.tax,
    },
    {
      title: t('total.price'),
      dataIndex: 'total_price',
      key: 'total_price',
      render: (total_price) => {
        return numberToPrice(total_price, defaultCurrency?.symbol);
      },
    },
  ];

  return (
    <Modal
      visible={!!orderId}
      title={t('order.created.successfully')}
      onOk={handleClose}
      onCancel={handleClose}
      className='container'
      footer={[
        <Button onClick={handleClose} className='buttons'>
          {t('back')}
        </Button>,
        <Button
          type='primary'
          onClick={() => window.print()}
          className='buttons'
        >
          <PrinterOutlined type='printer' />
          <span className='ml-1'>{t('print')}</span>
        </Button>,
      ]}
      style={{ minWidth: '80vw' }}
    >
      <div className='py-4 order-preview'>
        {loading ? (
          <div className='w-100 text-center'>
            <Spin />
          </div>
        ) : (
          <Card>
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
                      {data?.delivery_time}
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
                    {data?.user?.firstname} {data?.user?.lastname}
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
                columns={columns}
                dataSource={list || []}
                loading={loading}
                rowKey={(record) => record.id}
                pagination={false}
                expandable={{
                  expandedRowRender,
                  defaultExpandedRowKeys: ['0'],
                }}
              />
              <div className='d-flex justify-content-end'>
                <div className='text-right '>
                  <div className='border-bottom'>
                    <p className='mb-2'>
                      <span>{t('sub-total.amount')}: </span>
                      {numberToPrice(
                        data?.origin_price,
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
                      {t('total.tax')} :{' '}
                      {numberToPrice(data?.total_tax, data?.currency?.symbol)}
                    </p>
                    <p>
                      {t('coupon')} :{' '}
                      {numberToPrice(
                        data?.coupon?.price,
                        data?.currency?.symbol
                      )}
                    </p>
                    <p>
                      {t('service.fee')} :{' '}
                      {numberToPrice(data?.service_fee, data?.currency?.symbol)}
                    </p>
                  </div>
                  <h2 className='font-weight-semibold mt-3'>
                    <span className='mr-1'>
                      {t('grand.total')}:{' '}
                      <div className='ml-2 font-weight-bold'>
                        {numberToPrice(
                          data?.total_price,
                          data?.currency?.symbol
                        )}
                      </div>
                    </span>
                    {data?.total_discount ? (
                      <div className={data?.total_discount ? 'strike' : ''}>
                        {numberToPrice(
                          data?.total_discount,
                          data?.currency?.symbol
                        )}
                      </div>
                    ) : null}
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
