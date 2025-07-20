import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const inputRef = useRef(null);

  // 取得所有 items
  const fetchItems = async () => {
    const res = await axios.get('http://localhost:5000/api/items');
    setItems(res.data);
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
    setModalMode('add');
    setInput('');
    setShowModal(true);
  };

  // 開啟編輯 Modal
  const openEditModal = (id, name) => {
    setModalMode('edit');
    setEditId(id);
    setEditValue(name);
    setShowModal(true);
  };

  // 關閉 Modal
  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setEditValue('');
    setInput('');
  };

  // 新增 item
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input) return;
    await axios.post('http://localhost:5000/api/items', { name: input });
    setInput('');
    fetchItems();
    setShowModal(false);
    Swal.fire({ icon: 'success', title: '新增成功', text: '已新增一筆資料！' });
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
      await axios.delete(`http://localhost:5000/api/items/${id}`);
      fetchItems();
      Swal.fire({ icon: 'success', title: '刪除成功', text: '資料已刪除！' });
    }
  };

  // 儲存編輯
  const handleUpdate = async (e) => {
    e.preventDefault();
    await axios.put(`http://localhost:5000/api/items/${editId}`, {
      name: editValue,
    });
    setEditId(null);
    setEditValue('');
    setShowModal(false);
    fetchItems();
    Swal.fire({ icon: 'success', title: '更新成功', text: '資料已更新！' });
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
      <ul className="list-group">
        {items.map((item) => (
          <li
            key={item._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <span>{item.name}</span>
            <span>
              <button
                className="btn btn-sm btn-outline-success me-2"
                onClick={() => openEditModal(item._id, item.name)}
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
            </span>
          </li>
        ))}
      </ul>

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
                  {modalMode === 'add' ? '新增項目' : '編輯項目'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeModal}
                ></button>
              </div>
              <form onSubmit={modalMode === 'add' ? handleAdd : handleUpdate}>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control"
                    ref={inputRef}
                    value={modalMode === 'add' ? input : editValue}
                    onChange={(e) =>
                      modalMode === 'add'
                        ? setInput(e.target.value)
                        : setEditValue(e.target.value)
                    }
                    placeholder="請輸入項目名稱"
                  />
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
                    className={`btn btn-${
                      modalMode === 'add' ? 'primary' : 'warning'
                    }`}
                  >
                    {modalMode === 'add' ? '新增' : '更新'}
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
