import React, { useContext, useEffect, useState } from 'react';
import { Card, Switch, Table } from 'antd';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setMenuData } from 'redux/slices/menu';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { fetchCity } from 'redux/slices/deliveryzone/city';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import cityService from 'services/deliveryzone/city';
import { useNavigate, useSearchParams } from 'react-router-dom';

const City = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  let [searchParams, setSearchParams] = useSearchParams();
  const { setIsModalVisible } = useContext(Context);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const data = activeMenu?.data;
  const country_id = searchParams.get('country_id');

  const { list, meta, loading } = useSelector(
    (state) => state.deliveryCity,
    shallowEqual,
  );
  const [selectedId, setSeletedId] = useState(false);

  const showCity = (row) => {
    dispatch(
      addMenu({
        url: `deliveryzone/area?city_id=${row.id}`,
        id: 'area',
        name: t('area'),
      }),
    );
    navigate(`/deliveryzone/area?city_id=${row.id}`);
  };

  const handleActive = (id) => {
    setSeletedId(id);
    cityService
      .status(id)
      .then(() => {
        setIsModalVisible(false);
        dispatch(fetchCity({ country_id }));
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
          onClick={() => showCity(row)}
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
      dispatch(fetchCity({ country_id }));
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    const paramsData = {
      search: data?.search,
      country_id,
    };
    dispatch(fetchCity(paramsData));
  }, [activeMenu?.data]);

  const onChangePagination = (pageNumber) => {
    const { pageSize, current } = pageNumber;
    dispatch(fetchCity({ perPage: pageSize, page: current, country_id }));
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
      title={t('cities')}
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

export default City;
