import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Tag,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import Map from '../map';
import MediaUpload from '../upload';
import { AppstoreOutlined } from '@ant-design/icons';
import { RefetchSearch } from '../refetch-search';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import shopTagService from 'services/shopTag';
import userService from 'services/user';
import UserModal from 'components/shop/user-modal';
import CategoryModal from 'components/shop/category-modal';
import AdressForm from './address-form';

const ShopFormData = ({
  backImage,
  setBackImage,
  logoImage,
  setLogoImage,
  form,
  user,
  setLocation,
  location,
}) => {
  const { t } = useTranslation();
  const [userModal, setUserModal] = useState(null);
  const [category, setCategory] = useState(null);
  const [userRefetch, setUserRefetch] = useState(null);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const [value, setValue] = useState('');

  async function fetchUserList(search) {
    const params = { search, roles: 'user', 'empty-shop': 1 };
    setUserRefetch(false);
    return userService.search(params).then((res) =>
      res.data.map((item) => ({
        label: item?.firstname + ' ' + (item?.lastname || ''),
        value: item.id,
      })),
    );
  }

  async function fetchShopTag(search) {
    setUserRefetch(false);
    const params = { search };
    return shopTagService.getAll(params).then(({ data }) =>
      data.map((item) => ({
        label: item?.translation?.title || 'no name',
        value: item.id,
      })),
    );
  }

  const goToAddClient = () => {
    setUserModal(true);
    setUserRefetch(true);
  };

  const handleCancel = () => {
    setUserModal(false);
    setCategory(false);
  };

  const tagRender = (props) => {
    const { label, onClose } = props;
    const onPreventMouseDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    return (
      <Tag
        onMouseDown={onPreventMouseDown}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  };

  return (
    <Row gutter={12}>
      <Col span={24}>
        <Card>
          <Row gutter={12}>
            <Col span={4}>
              <Form.Item
                label={t('logo.image')}
                name='logo_img'
                rules={[
                  {
                    validator(_, value) {
                      if (logoImage?.length === 0) {
                        return Promise.reject(new Error(t('required')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <MediaUpload
                  type='shops/logo'
                  imageList={logoImage}
                  setImageList={setLogoImage}
                  form={form}
                  multiple={false}
                  name='logo_img'
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label={t('background.image')}
                name='background_img'
                rules={[
                  {
                    validator(_, value) {
                      if (backImage?.length === 0) {
                        return Promise.reject(new Error(t('required')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <MediaUpload
                  type='shops/background'
                  imageList={backImage}
                  setImageList={setBackImage}
                  form={form}
                  multiple={false}
                  name='background_img'
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                label={t('status.note')}
                name='status_note'
                rules={[
                  {
                    validator(_, value) {
                      if (!value) {
                        return Promise.reject(new Error(t('required')));
                      } else if (value && value?.trim() === '') {
                        return Promise.reject(new Error(t('no.empty.space')));
                      } else if (value && value?.length < 5) {
                        return Promise.reject(
                          new Error(t('must.be.at.least.5')),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name='status' label={t('status')}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item label={t('open')} name='open' valuePropName='checked'>
                <Switch disabled />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <Card title={t('general')}>
          <Row gutter={12}>
            <Col span={12}>
              <Row gutter={12}>
                <Col span={24}>
                  {languages.map((item, idx) => (
                    <Form.Item
                      key={'title' + idx}
                      label={t('title')}
                      name={`title[${item.locale}]`}
                      rules={[
                        {
                          validator(_, value) {
                            if (!value && item?.locale === defaultLang) {
                              return Promise.reject(new Error(t('required')));
                            } else if (value && value?.trim() === '') {
                              return Promise.reject(
                                new Error(t('no.empty.space')),
                              );
                            } else if (value && value?.length < 2) {
                              return Promise.reject(
                                new Error(t('must.be.at.least.2')),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      hidden={item.locale !== defaultLang}
                    >
                      <Input />
                    </Form.Item>
                  ))}
                </Col>
                <Col span={24}>
                  <Form.Item
                    label={t('phone')}
                    name='phone'
                    rules={[{ required: true, message: t('required') }]}
                  >
                    <InputNumber min={0} className='w-100' />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={12}>
              {languages.map((item, idx) => (
                <Form.Item
                  key={'desc' + idx}
                  label={t('description')}
                  name={`description[${item.locale}]`}
                  rules={[
                    {
                      validator(_, value) {
                        if (!value && item?.locale === defaultLang) {
                          return Promise.reject(new Error(t('required')));
                        } else if (value && value?.trim() === '') {
                          return Promise.reject(new Error(t('no.empty.space')));
                        } else if (value && value?.length < 5) {
                          return Promise.reject(
                            new Error(t('must.be.at.least.5')),
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                  hidden={item.locale !== defaultLang}
                >
                  <TextArea rows={4} />
                </Form.Item>
              ))}
            </Col>

            <Col span={12}>
              <Form.Item
                label={t('shop.tags')}
                name='tags'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch
                  mode='multiple'
                  fetchOptions={fetchShopTag}
                  refetch={userRefetch}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={t('seller')}
                name='user'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch
                  disabled={!user}
                  fetchOptions={fetchUserList}
                  refetch={userRefetch}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <Button
                        className='w-100'
                        icon={<AppstoreOutlined />}
                        onClick={goToAddClient}
                      >
                        {t('add.user')}
                      </Button>
                    </>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={12}>
        <Card title={t('delivery.time')}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='delivery_time_type'
                label={t('delivery_time_type')}
                rules={[{ required: true, message: t('required') }]}
              >
                <Select className='w-100'>
                  <Select.Option value='minute' label={t('minutes')} />
                  <Select.Option value='hour' label={t('hour')} />
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='delivery_time_from'
                label={t('delivery_time_from')}
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber min={0} className='w-100' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='delivery_time_to'
                label={t('delivery_time_to')}
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber min={0} className='w-100' />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={12}>
        <Card title={t('order.info')}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label={t('min.amount')}
                name='min_amount'
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber min={0} className='w-100' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('tax')}
                name='tax'
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  addonAfter={'%'}
                  className='w-100'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('admin.comission')}
                name='percentage'
                rules={[{ required: true, message: t('required') }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  className='w-100'
                  addonAfter={'%'}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <Card title={t('address')}>
          <Row gutter={12}>
            <Col span={12}>
              <AdressForm
                value={value}
                setValue={setValue}
                setLocation={setLocation}
              />
            </Col>
            <Col span={24}>
              <Map
                location={location}
                setLocation={setLocation}
                setAddress={(value) =>
                  form.setFieldsValue({ [`address[${defaultLang}]`]: value })
                }
              />
            </Col>
          </Row>
        </Card>
      </Col>
      {userModal && (
        <UserModal visible={userModal} handleCancel={() => handleCancel()} />
      )}
      {category && (
        <CategoryModal visible={category} handleCancel={() => handleCancel()} />
      )}
    </Row>
  );
};

export default ShopFormData;
