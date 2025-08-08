import React, { useState } from 'react';
import { Button, Col, Form, Input, Modal, Row } from 'antd';
import { useTranslation } from 'react-i18next';
import orderService from '../../services/order';

export default function OrderCancelNoteModal({
  canceledOrder,
  setCanceledOrder,
  changeColumnData,
}) {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const handleCancel = () => setCanceledOrder((prev) => !prev);
  const onFinish = (values) => {
    setLoading(true);
    const params = { ...values, status: 'canceled' };
    orderService
      .updateStatus(canceledOrder, params)
      .then(() => {
        handleCancel();
        changeColumnData();
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal
      visible={!!canceledOrder}
      onCancel={handleCancel}
      footer={[
        <Button
          key='save-form'
          type='primary'
          onClick={() => form.submit()}
          loading={loading}
        >
          {t('save')}
        </Button>,
        <Button key='cansel-modal' type='default' onClick={handleCancel}>
          {t('cancel')}
        </Button>,
      ]}
    >
      <Form form={form} layout='vertical' onFinish={onFinish}>
        <Row gutter={12}>
          <Col span={24}>
            <Form.Item
              label={t('canceled.note')}
              name='canceled_note'
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
              ]}
            >
              <Input.TextArea />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
