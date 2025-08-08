import React, { useContext, useEffect, useState } from 'react';
import { Card, Switch, Table } from 'antd';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from 'redux/slices/menu';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { fetchArea } from 'redux/slices/deliveryzone/area';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import areaService from 'services/deliveryzone/area';
import { useSearchParams } from 'react-router-dom';

const Area = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  let [searchParams, setSearchParams] = useSearchParams();
  const { setIsModalVisible } = useContext(Context);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const data = activeMenu?.data;
  const city_id = searchParams.get('city_id');

  const { list, meta, loading } = useSelector(
    (state) => state.deliveryArea,
    shallowEqual,
  );
  const [selectedId, setSeletedId] = useState(false);

  const handleActive = (id) => {
    setSeletedId(id);
    areaService
      .status(id)
      .then(() => {
        setIsModalVisible(false);
        dispatch(fetchArea({ city_id }));
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
      render: (translation, row) => translation?.title || '-',
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
      dispatch(fetchArea({ city_id }));
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    const paramsData = {
      search: data?.search,
      city_id,
    };
    dispatch(fetchArea(paramsData));
  }, [activeMenu?.data]);

  const onChangePagination = (pageNumber) => {
    const { pageSize, current } = pageNumber;
    dispatch(fetchArea({ perPage: pageSize, page: current, city_id }));
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
      title={t('areas')}
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

export default Area;
