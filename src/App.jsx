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
    setFormData(item);
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
      await axios.post(API_ENDPOINTS.ITEMS, formData);
      closeModal();
      fetchItems();
      Swal.fire({
        icon: 'success',
        title: '新增成功',
        text: '已新增一筆資料！',
      });
    } catch (error) {
      console.error('Error adding item:', error);
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
      await axios.put(`${API_ENDPOINTS.ITEMS}/${editId}`, formData);
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

  return (
    <div
      className="container py-5"
      style={{ fontFamily: 'Noto Sans TC, Roboto, sans-serif', maxWidth: 600 }}
    >
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
                <th scope="col">製令編號</th>
                <th scope="col">客戶</th>
                <th scope="col">部門</th>
                <th scope="col">內外銷</th>
                <th scope="col">首件/巡檢</th>
                <th scope="col" className="text-end">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.productionOrder}</td>
                  <td>{item.customer}</td>
                  <td>{item.department}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        item.salesType === '內銷' ? 'info' : 'success'
                      }`}
                    >
                      {item.salesType}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge bg-${
                        item.firstPieceInspection === '首件'
                          ? 'primary'
                          : 'secondary'
                      }`}
                    >
                      {item.firstPieceInspection}
                    </span>
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
                  <div className="row mb-3 align-items-center">
                    <label
                      htmlFor="productionOrder"
                      className="col-sm-3 col-form-label text-end fw-bold"
                    >
                      製令編號
                    </label>
                    <div className="col-sm-9">
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
                  </div>

                  <div className="row mb-3 align-items-center">
                    <label
                      htmlFor="customer"
                      className="col-sm-3 col-form-label text-end fw-bold"
                    >
                      客戶
                    </label>
                    <div className="col-sm-9">
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

                  <div className="row mb-3 align-items-center">
                    <label
                      htmlFor="salesType"
                      className="col-sm-3 col-form-label text-end fw-bold"
                    >
                      內外銷
                    </label>
                    <div className="col-sm-9">
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
  );
}

export default App;
