const { sql } = require('../config/db.config');

/**
 * GET /vaitro
 * Lấy danh sách tất cả các vai trò
 */
const getAllVaiTro = async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query('SELECT VaiTroID, TenVaiTro FROM VaiTro');
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getAllVaiTro:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách vai trò',
      error: error.message
    });
  }
};

/**
 * GET /vaitro/:id
 * Lấy thông tin chi tiết một vai trò theo ID
 */
const getVaiTroById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('VaiTroID', sql.Int, id);
    const result = await request.query('SELECT VaiTroID, TenVaiTro FROM VaiTro WHERE VaiTroID = @VaiTroID');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy vai trò với ID đã cung cấp'
      });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Lỗi trong getVaiTroById:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy thông tin vai trò',
      error: error.message
    });
  }
};

/**
 * POST /vaitro
 * Tạo mới một vai trò mới
 */
const createVaiTro = async (req, res) => {
  try {
    const { TenVaiTro } = req.body;

    if (!TenVaiTro || TenVaiTro.trim() === '') {
      return res.status(400).json({
        message: 'Tên vai trò không được để trống'
      });
    }

    const request = new sql.Request();
    request.input('TenVaiTro', sql.NVarChar(50), TenVaiTro.trim());
    
    // Thêm bản ghi và trả về dữ liệu vừa được chèn
    const result = await request.query(
      'INSERT INTO VaiTro (TenVaiTro) OUTPUT inserted.VaiTroID, inserted.TenVaiTro VALUES (@TenVaiTro)'
    );

    return res.status(201).json({
      message: 'Tạo vai trò thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong createVaiTro:', error);
    // Xử lý trùng lặp UNIQUE KEY (TenVaiTro)
    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({
        message: 'Tên vai trò đã tồn tại trong hệ thống'
      });
    }
    return res.status(500).json({
      message: 'Lỗi hệ thống khi tạo vai trò',
      error: error.message
    });
  }
};

/**
 * PUT /vaitro/:id
 * Cập nhật tên vai trò theo ID
 */
const updateVaiTro = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenVaiTro } = req.body;

    if (!TenVaiTro || TenVaiTro.trim() === '') {
      return res.status(400).json({
        message: 'Tên vai trò không được để trống'
      });
    }

    const request = new sql.Request();
    request.input('VaiTroID', sql.Int, id);
    request.input('TenVaiTro', sql.NVarChar(50), TenVaiTro.trim());

    const result = await request.query(
      'UPDATE VaiTro SET TenVaiTro = @TenVaiTro OUTPUT inserted.VaiTroID, inserted.TenVaiTro WHERE VaiTroID = @VaiTroID'
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy vai trò để cập nhật'
      });
    }

    return res.status(200).json({
      message: 'Cập nhật vai trò thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong updateVaiTro:', error);
    // Xử lý trùng lặp UNIQUE KEY (TenVaiTro)
    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({
        message: 'Tên vai trò mới đã tồn tại trong hệ thống'
      });
    }
    return res.status(500).json({
      message: 'Lỗi hệ thống khi cập nhật vai trò',
      error: error.message
    });
  }
};

/**
 * DELETE /vaitro/:id
 * Xóa một vai trò theo ID
 */
const deleteVaiTro = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('VaiTroID', sql.Int, id);

    const result = await request.query(
      'DELETE FROM VaiTro OUTPUT deleted.VaiTroID WHERE VaiTroID = @VaiTroID'
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy vai trò để xóa'
      });
    }

    return res.status(200).json({
      message: 'Xóa vai trò thành công'
    });
  } catch (error) {
    console.error('Lỗi trong deleteVaiTro:', error);
    // Xử lý lỗi ràng buộc khóa ngoại (foreign key constraint - e.g., có người dùng thuộc vai trò này)
    if (error.number === 547) {
      return res.status(400).json({
        message: 'Không thể xóa vai trò này vì đang có người dùng liên kết với vai trò này'
      });
    }
    return res.status(500).json({
      message: 'Lỗi hệ thống khi xóa vai trò',
      error: error.message
    });
  }
};

module.exports = {
  getAllVaiTro,
  getVaiTroById,
  createVaiTro,
  updateVaiTro,
  deleteVaiTro
};
