import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, Card, Col, Form, Input, InputNumber, Row } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { removeFromMenu, setMenuData } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import getTranslationFields from 'helpers/getTranslationFields';
import LanguageList from 'components/language-list';
import deliveryPriceService from 'services/delivery-price';
import { fetchDeliveryPrice } from 'redux/slices/delivery-price';
import { RefetchSearch } from 'components/refetch-search';
import regionService from 'services/deliveryzone/region';
import countryService from 'services/deliveryzone/country';
import cityService from 'services/deliveryzone/city';
import areaService from 'services/deliveryzone/area';

const AddDeliveryPrice = () => {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [image, setImage] = useState([]);
  const [location, setLocation] = useState('');
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [formData, setFormData] = useState({});
  const { country, region, city } = formData;

  const { languages, defaultLang } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const { defaultCurrency } = useSelector(
    (state) => state.currency,
    shallowEqual,
  );
  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
  }, []);

  const onFinish = (values) => {
    const { area, city, country, region, price, fitting_rooms, active } =
      values;

    const body = {
      price,
      fitting_rooms,
      location: {
        latitude: location?.lat,
        longitude: location?.lng,
      },
      active: active ? 1 : 0,
      area_id: area?.value,
      city_id: city?.value,
      country_id: country?.value,
      region_id: region?.value,
      images: image.map((image) => image.name),
      // title: getTranslationFields(languages, values, 'title'),
      address: getTranslationFields(languages, values, 'address'),
    };
    setLoadingBtn(true);
    const nextUrl = 'delivery-price';
    deliveryPriceService
      .create(body)
      .then(() => {
        toast.success(t('successfully.created'));
        dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        navigate(`/${nextUrl}`);
        dispatch(fetchDeliveryPrice());
      })
      .finally(() => setLoadingBtn(false));
  };

  async function fetchRegion(search) {
    const params = {
      search,
      status: 1,
      perPage: 10,
    };
    return regionService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation.title || 'no name',
        value: item.id,
      })),
    );
  }
  async function fetchCountry(search) {
    const params = { search, status: 1, perPage: 10, region_id: region?.value };
    return countryService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation.title || 'no name',
        value: item.id,
      })),
    );
  }
  async function fetchCity(search) {
    const params = {
      search,
      status: 1,
      perPage: 10,
      country_id: country?.value,
    };
    return cityService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation.title || 'no name',
        value: item.id,
      })),
    );
  }
  async function fetchArea(search) {
    const params = {
      search,
      status: 1,
      perPage: 10,
      city_id: city?.value,
    };
    return areaService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation.title || 'no name',
        value: item.id,
      })),
    );
  }

  return (
    <Form
      name='add.delivery.price'
      layout='vertical'
      onFinish={onFinish}
      form={form}
      initialValues={{ clickable: true, ...activeMenu.data }}
    >
      <Row gutter={[24, 24]}>
        {/*<Col span={24}>*/}
        {/*  <LanguageList />*/}
        {/*</Col>*/}

        <Col span={12}>
          <Card title={t('deliveryzone')} className='h-100'>
            {/*<Col span={24}>*/}
            {/*  {languages.map((item, idx) => (*/}
            {/*    <Form.Item*/}
            {/*      key={'title' + idx}*/}
            {/*      label={t('title')}*/}
            {/*      name={`title[${item.locale}]`}*/}
            {/*      rules={[*/}
            {/*        {*/}
            {/*          required: item.locale === defaultLang,*/}
            {/*          message: t('required'),*/}
            {/*        },*/}
            {/*      ]}*/}
            {/*      hidden={item.locale !== defaultLang}*/}
            {/*    >*/}
            {/*      <Input />*/}
            {/*    </Form.Item>*/}
            {/*  ))}*/}
            {/*</Col>*/}
            <Col span={24}>
              <Form.Item
                label={t('region')}
                name='region'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch
                  fetchOptions={fetchRegion}
                  dropdownRender={(menu) => <>{menu}</>}
                  refetch={true}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, region: value }));
                    form.resetFields(['city', 'area', 'country']);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label={t('country')}
                name='country'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch
                  fetchOptions={fetchCountry}
                  dropdownRender={(menu) => <>{menu}</>}
                  refetch={true}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, country: value }));
                    form.resetFields(['city', 'area']);
                  }}
                  disabled={!Boolean(region?.value)}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label={t('city')}
                name='city'
                rules={[{ required: false, message: t('required') }]}
              >
                <RefetchSearch
                  fetchOptions={fetchCity}
                  dropdownRender={(menu) => <>{menu}</>}
                  refetch={true}
                  disabled={!Boolean(country?.value)}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, city: value }));
                    form.resetFields(['area']);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label={t('area')}
                name='area'
                rules={[{ required: false, message: t('required') }]}
              >
                <RefetchSearch
                  fetchOptions={fetchArea}
                  dropdownRender={(menu) => <>{menu}</>}
                  refetch={true}
                  disabled={!Boolean(city?.value)}
                />
              </Form.Item>
            </Col>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={t('pricing')} className='h-100'>
            <Col span={24}>
              <Form.Item
                label={`${t('price')} (${defaultCurrency?.symbol})`}
                name='price'
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber className='w-100' />
              </Form.Item>
            </Col>
            <div className='flex-grow-1 d-flex justify-content-end'>
              <div className='pb-5'>
                <Button type='primary' htmlType='submit' loading={loadingBtn}>
                  {t('submit')}
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Form>
  );
};

export default AddDeliveryPrice;
