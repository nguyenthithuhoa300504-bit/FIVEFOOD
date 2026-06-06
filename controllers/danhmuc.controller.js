const { sql } = require('../config/db.config');

/**
 * GET /danhmuc
 * Lấy danh sách tất cả các danh mục
 */
const getAllDanhMuc = async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query('SELECT DanhMucID, TenDanhMuc, MoTa FROM DanhMuc');
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Lỗi trong getAllDanhMuc:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy danh sách danh mục',
      error: error.message
    });
  }
};

/**
 * GET /danhmuc/:id
 * Lấy thông tin chi tiết một danh mục theo ID
 */
const getDanhMucById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('DanhMucID', sql.Int, id);
    const result = await request.query('SELECT DanhMucID, TenDanhMuc, MoTa FROM DanhMuc WHERE DanhMucID = @DanhMucID');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy danh mục với ID đã cung cấp'
      });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Lỗi trong getDanhMucById:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy thông tin danh mục',
      error: error.message
    });
  }
};

/**
 * POST /danhmuc
 * Tạo mới một danh mục
 */
const createDanhMuc = async (req, res) => {
  try {
    const { TenDanhMuc, MoTa } = req.body;

    if (!TenDanhMuc || TenDanhMuc.trim() === '') {
      return res.status(400).json({
        message: 'Tên danh mục không được để trống'
      });
    }

    const request = new sql.Request();
    request.input('TenDanhMuc', sql.NVarChar(100), TenDanhMuc.trim());
    request.input('MoTa', sql.NVarChar(255), MoTa ? MoTa.trim() : null);

    const result = await request.query(
      'INSERT INTO DanhMuc (TenDanhMuc, MoTa) OUTPUT inserted.DanhMucID, inserted.TenDanhMuc, inserted.MoTa VALUES (@TenDanhMuc, @MoTa)'
    );

    return res.status(201).json({
      message: 'Tạo danh mục thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong createDanhMuc:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi tạo danh mục',
      error: error.message
    });
  }
};

/**
 * PUT /danhmuc/:id
 * Cập nhật thông tin danh mục theo ID
 */
const updateDanhMuc = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenDanhMuc, MoTa } = req.body;

    if (!TenDanhMuc || TenDanhMuc.trim() === '') {
      return res.status(400).json({
        message: 'Tên danh mục không được để trống'
      });
    }

    const request = new sql.Request();
    request.input('DanhMucID', sql.Int, id);
    request.input('TenDanhMuc', sql.NVarChar(100), TenDanhMuc.trim());
    request.input('MoTa', sql.NVarChar(255), MoTa ? MoTa.trim() : null);

    const result = await request.query(
      'UPDATE DanhMuc SET TenDanhMuc = @TenDanhMuc, MoTa = @MoTa OUTPUT inserted.DanhMucID, inserted.TenDanhMuc, inserted.MoTa WHERE DanhMucID = @DanhMucID'
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy danh mục để cập nhật'
      });
    }

    return res.status(200).json({
      message: 'Cập nhật danh mục thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong updateDanhMuc:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi cập nhật danh mục',
      error: error.message
    });
  }
};

/**
 * DELETE /danhmuc/:id
 * Xóa một danh mục theo ID
 */
const deleteDanhMuc = async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('DanhMucID', sql.Int, id);

    const result = await request.query(
      'DELETE FROM DanhMuc OUTPUT deleted.DanhMucID WHERE DanhMucID = @DanhMucID'
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy danh mục để xóa'
      });
    }

    return res.status(200).json({
      message: 'Xóa danh mục thành công'
    });
  } catch (error) {
    console.error('Lỗi trong deleteDanhMuc:', error);
    if (error.number === 547) {
      return res.status(400).json({
        message: 'Không thể xóa danh mục này vì đang có ràng buộc dữ liệu liên quan'
      });
    }
    return res.status(500).json({
      message: 'Lỗi hệ thống khi xóa danh mục',
      error: error.message
    });
  }
};

module.exports = {
  getAllDanhMuc,
  getDanhMucById,
  createDanhMuc,
  updateDanhMuc,
  deleteDanhMuc
};
