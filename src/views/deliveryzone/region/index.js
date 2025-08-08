import React, { useContext, useEffect, useState } from 'react';
import { Card, Switch, Table } from 'antd';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setMenuData } from 'redux/slices/menu';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { fetchRegion } from 'redux/slices/deliveryzone/region';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import regionService from 'services/deliveryzone/region';
import { useNavigate } from 'react-router-dom';

const Region = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setIsModalVisible } = useContext(Context);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const data = activeMenu?.data;
  const { list, meta, loading } = useSelector(
    (state) => state.deliveryRegion,
    shallowEqual,
  );
  const [selectedId, setSeletedId] = useState(false);
  const showRegion = (row) => {
    dispatch(
      addMenu({
        url: `deliveryzone/country?region_id=${row.id}`,
        id: 'country',
        name: t('country'),
      }),
    );
    navigate(`/deliveryzone/country?region_id=${row.id}`);
  };
  const handleActive = (id) => {
    setSeletedId(id);
    regionService
      .status(id)
      .then(() => {
        setIsModalVisible(false);
        dispatch(fetchRegion());
        toast.success(t('successfully.updated'));
      })
      .finally(() => {
        setSeletedId(null);
      });
  };

  const columns = [
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: t('name'),
      dataIndex: 'translation',
      key: 'translation',
      render: (translation, row) => (
        <div
          style={{
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={() => showRegion(row)}
        >
          {translation?.title || '-'}
        </div>
      ),
    },
    {
      title: t('active'),
      dataIndex: 'active',
      key: 'active',
      render: (active, row) => {
        return (
          <Switch
            key={row.id}
            onChange={() => handleActive(row.id)}
            checked={active}
            loading={Boolean(selectedId === row.id)}
          />
        );
      },
    },
  ];

  useEffect(() => {
    if (activeMenu.refetch) {
      dispatch(fetchRegion());
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    const paramsData = {
      search: data?.search,
    };
    dispatch(fetchRegion(paramsData));
  }, [activeMenu?.data]);

  const onChangePagination = (pageNumber) => {
    const { pageSize, current } = pageNumber;
    dispatch(fetchRegion({ perPage: pageSize, page: current }));
  };
  const handleFilter = (item, name) => {
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, [name]: item },
      }),
    );
  };

  return (
    <Card
      title={t('regions')}
      extra={
        <>
          <SearchInput
            placeholder={t('search')}
            handleChange={(search) => handleFilter(search, 'search')}
            defaultValue={data?.search}
            resetSearch={!data?.search}
          />
        </>
      }
    >
      <Table
        columns={columns}
        dataSource={list}
        pagination={{
          pageSize: meta.per_page,
          page: meta.current_page,
          total: meta.total,
        }}
        rowKey={(record) => record.id}
        loading={loading}
        onChange={onChangePagination}
      />
    </Card>
  );
};

export default Region;
