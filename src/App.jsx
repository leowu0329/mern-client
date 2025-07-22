import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { API_ENDPOINTS } from './config/api';
import './App.css';

const INITIAL_FORM_STATE = {
  salesType: '內銷',
  customer: '',
  productionOrder: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  operator: '',
  drawingVersion: '',
  inspector: '',
  defects: [], // 新增 defects 欄位
};

const DEFECT_CATEGORY_OPTIONS = [
  '無圖面',
  '圖物不符',
  '尺寸NG',
  '外觀NG',
  '人員作業疏失',
  '特性異常',
];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

function App() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const [orderError, setOrderError] = useState('');

  // 取得所有 items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.ITEMS);
      setItems(res.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      Swal.fire({
        icon: 'error',
        title: '載入失敗',
        text: '無法載入資料，請檢查網路連線或後端服務狀態。',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (showModal && inputRef.current) {
      setTimeout(() => inputRef.current && inputRef.current.focus(), 200);
    }
  }, [showModal]);

  // 開啟新增 Modal
  const openAddModal = () => {
    setEditId(null);
    // 預設為內銷，客戶為大井
    setFormData({ ...INITIAL_FORM_STATE, customer: '大井' });
    setShowModal(true);
  };

  // 開啟編輯 Modal
  const openEditModal = (item) => {
    setEditId(item._id);
    setFormData({
      ...item,
      date: new Date(item.date).toISOString().split('T')[0],
      time: item.time ? item.time.slice(0, 5) : '',
      defects: item.defects || [],
    });
    setShowModal(true);
  };

  // 關閉 Modal
  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData(INITIAL_FORM_STATE);
  };

  // 新增 item
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.productionOrder) {
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: '製令編號為必填欄位。',
      });
      return;
    }
    try {
      const payload = {
        ...formData,
        defects: formData.defects.filter((d) => d.defectCategory),
      };
      await axios.post(API_ENDPOINTS.ITEMS, payload);
      closeModal();
      fetchItems();
      Swal.fire({
        icon: 'success',
        title: '新增成功',
        text: '已新增一筆資料！',
      });
    } catch (error) {
      console.error('Error adding item:', error);
      console.error(error.response?.data || error);
      Swal.fire({
        icon: 'error',
        title: '新增失敗',
        text: '無法新增資料，請稍後再試。',
      });
    }
  };

  // 刪除 item
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '確定要刪除嗎?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_ENDPOINTS.ITEMS}/${id}`);
        fetchItems();
        Swal.fire({ icon: 'success', title: '刪除成功', text: '資料已刪除！' });
      } catch (error) {
        console.error('Error deleting item:', error);
        Swal.fire({
          icon: 'error',
          title: '刪除失敗',
          text: '無法刪除資料，請稍後再試。',
        });
      }
    }
  };

  // 儲存編輯
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        defects: formData.defects.filter((d) => d.defectCategory),
      };
      await axios.put(`${API_ENDPOINTS.ITEMS}/${editId}`, payload);
      setEditId(null);
      setFormData(INITIAL_FORM_STATE);
      setShowModal(false);
      fetchItems();
      Swal.fire({ icon: 'success', title: '更新成功', text: '資料已更新！' });
    } catch (error) {
      console.error('Error updating item:', error);
      Swal.fire({
        icon: 'error',
        title: '更新失敗',
        text: '無法更新資料，請稍後再試。',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'productionOrder') {
      if (value.length !== 16) {
        setOrderError('製令編號必須為16個字元');
      } else {
        setOrderError('');
      }
    }

    if (name === 'salesType') {
      // 當內外銷選項改變時，連動更新客戶欄位
      setFormData((prevState) => ({
        ...prevState,
        salesType: value,
        customer: value === '內銷' ? '大井' : '',
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  // 新增/移除 defects 欄位的處理
  const handleDefectChange = (idx, field, value) => {
    setFormData((prev) => {
      const newDefects = prev.defects.map((d, i) =>
        i === idx ? { ...d, [field]: value } : d,
      );
      // 清空下層欄位
      if (field === 'defectCategory') {
        newDefects[idx].defectStatus = '';
        newDefects[idx].countermeasure = '';
      } else if (field === 'defectStatus') {
        newDefects[idx].countermeasure = '';
      }
      return { ...prev, defects: newDefects };
    });
  };
  const addDefect = () => {
    setFormData((prev) => ({
      ...prev,
      defects: [
        ...prev.defects,
        { defectCategory: '', defectStatus: '', countermeasure: '' },
      ],
    }));
  };
  const removeDefect = (idx) => {
    setFormData((prev) => ({
      ...prev,
      defects: prev.defects.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div
      className="container-fluid py-5 d-flex justify-content-center align-items-start"
      style={{
        fontFamily: 'Noto Sans TC, Roboto, sans-serif',
        minHeight: '100vh',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1980 }}>
        <h1 className="mb-4 text-center fw-bold">MERN CRUD Example</h1>
        <div className="d-flex justify-content-end mb-3">
          <button className="btn btn-primary" onClick={openAddModal}>
            <FaPlus className="me-2" /> 新增
          </button>
        </div>
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">載入中...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th scope="col">日期/時間</th>
                  <th scope="col">內外銷/客戶</th>
                  <th scope="col">製令編號/部門</th>
                  <th scope="col">作業人員</th>
                  <th scope="col">圖面版次</th>
                  <th scope="col">不良分類</th>
                  <th scope="col">不良狀況</th>
                  <th scope="col">處置對策</th>
                  <th scope="col" className="text-end">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div>
                        {formatDate(item.date)}{' '}
                        <span style={{ fontSize: '0.95em', color: '#888' }}>
                          {item.time}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`badge bg-${
                            item.firstPieceInspection === '首件'
                              ? 'primary'
                              : 'secondary'
                          } me-2`}
                        >
                          {item.firstPieceInspection}
                        </span>
                        <span style={{ fontSize: '0.95em', color: '#888' }}>
                          {item.inspector}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span
                          className={`badge bg-${
                            item.salesType === '內銷' ? 'info' : 'success'
                          }`}
                        >
                          {item.salesType}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.95em', color: '#888' }}>
                        {item.customer}
                      </div>
                    </td>
                    <td>
                      <div>{item.productionOrder}</div>
                      <div style={{ fontSize: '0.95em', color: '#888' }}>
                        {item.department}
                      </div>
                    </td>
                    <td>{item.operator}</td>
                    <td>{item.drawingVersion}</td>
                    <td>
                      {item.defects && item.defects.length > 0
                        ? item.defects.map((d, i) => (
                            <div key={i}>{d.defectCategory || '-'}</div>
                          ))
                        : '-'}
                    </td>
                    <td>
                      {item.defects && item.defects.length > 0
                        ? item.defects.map((d, i) => (
                            <div key={i}>{d.defectStatus || '-'}</div>
                          ))
                        : '-'}
                    </td>
                    <td>
                      {item.defects && item.defects.length > 0
                        ? item.defects.map((d, i) => (
                            <div key={i}>{d.countermeasure || '-'}</div>
                          ))
                        : '-'}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => openEditModal(item)}
                        title="編輯"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(item._id)}
                        title="刪除"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bootstrap Modal */}
        {showModal && (
          <div
            className="modal fade show"
            style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }}
            tabIndex="-1"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editId ? '編輯項目' : '新增項目'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={closeModal}
                  ></button>
                </div>
                <form onSubmit={editId ? handleUpdate : handleAdd}>
                  <div className="modal-body">
                    {/* --- Unified Form Start --- */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label
                          htmlFor="productionOrder"
                          className="form-label fw-bold"
                        >
                          製令編號
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="productionOrder"
                          name="productionOrder"
                          ref={inputRef}
                          value={formData.productionOrder}
                          onChange={handleInputChange}
                          placeholder="請輸入製令編號"
                          required
                        />
                        {orderError && (
                          <div
                            className="mt-1 text-danger fw-bold text-start"
                            style={{ fontSize: '0.95em' }}
                          >
                            {orderError}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label
                          htmlFor="inspector"
                          className="form-label fw-bold"
                        >
                          巡檢人員
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="inspector"
                          name="inspector"
                          value={formData.inspector}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="date" className="form-label fw-bold">
                          日期
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="time" className="form-label fw-bold">
                          時間
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          id="time"
                          name="time"
                          value={formData.time}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label
                          htmlFor="salesType"
                          className="form-label fw-bold"
                        >
                          內外銷
                        </label>
                        <select
                          className="form-select"
                          id="salesType"
                          name="salesType"
                          value={formData.salesType}
                          onChange={handleInputChange}
                        >
                          <option value="內銷">內銷</option>
                          <option value="外銷">外銷</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label
                          htmlFor="customer"
                          className="form-label fw-bold"
                        >
                          客戶
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="customer"
                          name="customer"
                          value={formData.customer}
                          onChange={handleInputChange}
                          placeholder={
                            formData.salesType === '內銷' ? '' : '請輸入客戶'
                          }
                          required
                          disabled={formData.salesType === '內銷'}
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label
                          htmlFor="operator"
                          className="form-label fw-bold"
                        >
                          作業人員
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="operator"
                          name="operator"
                          value={formData.operator}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label
                          htmlFor="drawingVersion"
                          className="form-label fw-bold"
                        >
                          圖面版次
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="drawingVersion"
                          name="drawingVersion"
                          value={formData.drawingVersion}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* 不良資訊巢狀表單 */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">不良資訊</label>
                      {formData.defects && formData.defects.length > 0 && (
                        <div className="d-flex flex-column gap-2">
                          {formData.defects.map((defect, idx) => (
                            <div
                              key={idx}
                              className="border rounded p-2 mb-2 bg-light-subtle"
                            >
                              <div className="row g-2 align-items-end">
                                <div className="col-md-4">
                                  <label className="form-label">不良分類</label>
                                  <select
                                    className="form-select"
                                    value={defect.defectCategory || ''}
                                    onChange={(e) =>
                                      handleDefectChange(
                                        idx,
                                        'defectCategory',
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">請選擇</option>
                                    {DEFECT_CATEGORY_OPTIONS.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label">不良狀況</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={defect.defectStatus || ''}
                                    onChange={(e) =>
                                      handleDefectChange(
                                        idx,
                                        'defectStatus',
                                        e.target.value,
                                      )
                                    }
                                    disabled={!defect.defectCategory}
                                    placeholder="請先選擇不良分類"
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label">處置對策</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={defect.countermeasure || ''}
                                    onChange={(e) =>
                                      handleDefectChange(
                                        idx,
                                        'countermeasure',
                                        e.target.value,
                                      )
                                    }
                                    disabled={!defect.defectStatus}
                                    placeholder="請先輸入不良狀況"
                                  />
                                </div>
                                <div className="col-md-1 d-flex align-items-end">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeDefect(idx)}
                                    title="移除此筆不良"
                                  >
                                    &times;
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm mt-2"
                        onClick={addDefect}
                      >
                        新增不良記錄
                      </button>
                    </div>
                    {/* --- Unified Form End --- */}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className={`btn btn-${editId ? 'warning' : 'primary'}`}
                      disabled={loading}
                    >
                      {loading ? (
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : null}
                      {editId ? '更新' : '新增'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
