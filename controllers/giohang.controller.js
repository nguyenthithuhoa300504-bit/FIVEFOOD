const { sql } = require('../config/db.config');

/**
 * GET /giohang/:nguoidungid
 * Lấy thông tin giỏ hàng của người dùng. Nếu chưa có giỏ hàng, tự động tạo mới.
 */
const getGioHangByNguoiDungId = async (req, res) => {
  try {
    const { nguoidungid } = req.params;

    if (!nguoidungid) {
      return res.status(400).json({
        message: 'Thiếu NguoiDungID người dùng'
      });
    }

    const request = new sql.Request();
    request.input('NguoiDungID', sql.Int, nguoidungid);

    // 1. Kiểm tra xem người dùng có tồn tại trong hệ thống hay không
    const userCheck = await request.query('SELECT NguoiDungID, HoTen FROM NguoiDung WHERE NguoiDungID = @NguoiDungID');
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng với ID đã cung cấp'
      });
    }

    // 2. Kiểm tra xem người dùng đã có giỏ hàng chưa
    let cartResult = await request.query('SELECT GioHangID FROM GioHang WHERE NguoiDungID = @NguoiDungID');
    let gioHangId;

    if (cartResult.recordset.length === 0) {
      // Nếu chưa có, tự động khởi tạo giỏ hàng mới
      const createCartResult = await request.query(
        'INSERT INTO GioHang (NguoiDungID) OUTPUT inserted.GioHangID VALUES (@NguoiDungID)'
      );
      gioHangId = createCartResult.recordset[0].GioHangID;
    } else {
      gioHangId = cartResult.recordset[0].GioHangID;
    }

    // 3. Lấy toàn bộ các sản phẩm trong giỏ hàng (ChiTietGioHang join SanPham)
    const itemsRequest = new sql.Request();
    itemsRequest.input('GioHangID', sql.Int, gioHangId);
    const itemsResult = await itemsRequest.query(`
      SELECT 
        ct.ChiTietGioHangID,
        ct.GioHangID,
        ct.SanPhamID,
        ct.SoLuong,
        sp.TenSanPham,
        sp.Gia,
        sp.HinhAnh,
        sp.SoLuongTon,
        sp.TrangThai,
        (ct.SoLuong * sp.Gia) AS ThanhTien
      FROM ChiTietGioHang ct
      JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
      WHERE ct.GioHangID = @GioHangID
    `);

    const items = itemsResult.recordset;
    
    // Tính tổng tiền của giỏ hàng
    const tongTien = items.reduce((sum, item) => sum + item.ThanhTien, 0);

    return res.status(200).json({
      message: 'Lấy thông tin giỏ hàng thành công',
      data: {
        GioHangID: gioHangId,
        NguoiDungID: parseInt(nguoidungid),
        HoTen: userCheck.recordset[0].HoTen,
        TongTien: tongTien,
        ChiTiet: items
      }
    });
  } catch (error) {
    console.error('Lỗi trong getGioHangByNguoiDungId:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi lấy giỏ hàng',
      error: error.message
    });
  }
};

/**
 * POST /giohang/them
 * Thêm một sản phẩm vào giỏ hàng. 
 * Nếu sản phẩm đã có, cộng thêm số lượng. 
 * Kiểm tra tính hợp lệ của sản phẩm và số lượng tồn kho.
 */
const themVaoGioHang = async (req, res) => {
  try {
    const { NguoiDungID, SanPhamID, SoLuong } = req.body;
    const qty = parseInt(SoLuong) || 1;

    if (!NguoiDungID || !SanPhamID) {
      return res.status(400).json({
        message: 'Thiếu thông tin NguoiDungID hoặc SanPhamID trong yêu cầu'
      });
    }

    if (qty <= 0) {
      return res.status(400).json({
        message: 'Số lượng sản phẩm thêm vào giỏ hàng phải lớn hơn 0'
      });
    }

    // 1. Kiểm tra người dùng có tồn tại không
    const userReq = new sql.Request();
    userReq.input('NguoiDungID', sql.Int, NguoiDungID);
    const userCheck = await userReq.query('SELECT NguoiDungID FROM NguoiDung WHERE NguoiDungID = @NguoiDungID');
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng trong hệ thống'
      });
    }

    // 2. Kiểm tra sản phẩm có tồn tại và đang hoạt động không
    const prodReq = new sql.Request();
    prodReq.input('SanPhamID', sql.Int, SanPhamID);
    const prodCheck = await prodReq.query(
      'SELECT SanPhamID, TenSanPham, Gia, SoLuongTon, TrangThai FROM SanPham WHERE SanPhamID = @SanPhamID'
    );
    if (prodCheck.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm cần thêm'
      });
    }

    const product = prodCheck.recordset[0];
    if (product.TrangThai === false) {
      return res.status(400).json({
        message: `Sản phẩm "${product.TenSanPham}" hiện đang tạm ngưng bán`
      });
    }

    // 3. Tìm hoặc khởi tạo giỏ hàng cho người dùng
    let gioHangId;
    const cartCheck = await userReq.query('SELECT GioHangID FROM GioHang WHERE NguoiDungID = @NguoiDungID');
    if (cartCheck.recordset.length === 0) {
      const createCart = await userReq.query(
        'INSERT INTO GioHang (NguoiDungID) OUTPUT inserted.GioHangID VALUES (@NguoiDungID)'
      );
      gioHangId = createCart.recordset[0].GioHangID;
    } else {
      gioHangId = cartCheck.recordset[0].GioHangID;
    }

    // 4. Kiểm tra sản phẩm đã tồn tại trong giỏ hàng chưa
    const detailReq = new sql.Request();
    detailReq.input('GioHangID', sql.Int, gioHangId);
    detailReq.input('SanPhamID', sql.Int, SanPhamID);
    const itemCheck = await detailReq.query(
      'SELECT ChiTietGioHangID, SoLuong FROM ChiTietGioHang WHERE GioHangID = @GioHangID AND SanPhamID = @SanPhamID'
    );

    let result;
    if (itemCheck.recordset.length > 0) {
      // Đã có trong giỏ hàng, cập nhật thêm số lượng mới
      const currentItem = itemCheck.recordset[0];
      const newQty = currentItem.SoLuong + qty;

      // Kiểm tra xem tổng số lượng mới có vượt quá lượng tồn kho hay không
      if (newQty > product.SoLuongTon) {
        return res.status(400).json({
          message: `Không thể thêm. Tổng số lượng sản phẩm trong giỏ hàng (${newQty}) sẽ vượt quá tồn kho của cửa hàng (${product.SoLuongTon})`
        });
      }

      detailReq.input('NewQty', sql.Int, newQty);
      result = await detailReq.query(`
        UPDATE ChiTietGioHang 
        SET SoLuong = @NewQty 
        OUTPUT inserted.ChiTietGioHangID, inserted.GioHangID, inserted.SanPhamID, inserted.SoLuong
        WHERE GioHangID = @GioHangID AND SanPhamID = @SanPhamID
      `);
    } else {
      // Chưa có trong giỏ hàng, thực hiện thêm mới
      if (qty > product.SoLuongTon) {
        return res.status(400).json({
          message: `Số lượng muốn mua (${qty}) vượt quá số lượng tồn kho của cửa hàng (${product.SoLuongTon})`
        });
      }

      detailReq.input('SoLuong', sql.Int, qty);
      result = await detailReq.query(`
        INSERT INTO ChiTietGioHang (GioHangID, SanPhamID, SoLuong)
        OUTPUT inserted.ChiTietGioHangID, inserted.GioHangID, inserted.SanPhamID, inserted.SoLuong
        VALUES (@GioHangID, @SanPhamID, @SoLuong)
      `);
    }

    return res.status(200).json({
      message: 'Thêm sản phẩm vào giỏ hàng thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong themVaoGioHang:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi thêm sản phẩm vào giỏ hàng',
      error: error.message
    });
  }
};

/**
 * PUT /giohang/capnhat
 * Cập nhật số lượng của một sản phẩm trong giỏ hàng.
 * Hỗ trợ nhận diện qua ChiTietGioHangID hoặc cặp (NguoiDungID, SanPhamID).
 * Nếu số lượng cập nhật <= 0, tự động xóa sản phẩm ra khỏi giỏ hàng.
 */
const capNhatGioHang = async (req, res) => {
  try {
    const { NguoiDungID, SanPhamID, ChiTietGioHangID, SoLuong } = req.body;

    if (SoLuong === undefined) {
      return res.status(400).json({
        message: 'Thiếu số lượng (SoLuong) cần cập nhật'
      });
    }

    const qty = parseInt(SoLuong);
    let chiTietGioHangId = ChiTietGioHangID;
    
    const request = new sql.Request();

    // 1. Xác định ChiTietGioHangID nếu chỉ truyền NguoiDungID và SanPhamID
    if (!chiTietGioHangId) {
      if (!NguoiDungID || !SanPhamID) {
        return res.status(400).json({
          message: 'Vui lòng cung cấp ChiTietGioHangID hoặc cả hai trường NguoiDungID và SanPhamID'
        });
      }

      request.input('NguoiDungID', sql.Int, NguoiDungID);
      request.input('SanPhamID', sql.Int, SanPhamID);

      const itemResult = await request.query(`
        SELECT ct.ChiTietGioHangID 
        FROM ChiTietGioHang ct
        JOIN GioHang gh ON ct.GioHangID = gh.GioHangID
        WHERE gh.NguoiDungID = @NguoiDungID AND ct.SanPhamID = @SanPhamID
      `);

      if (itemResult.recordset.length === 0) {
        return res.status(404).json({
          message: 'Không tìm thấy sản phẩm này trong giỏ hàng của bạn'
        });
      }
      chiTietGioHangId = itemResult.recordset[0].ChiTietGioHangID;
    }

    // 2. Nếu số lượng <= 0, thực hiện xóa sản phẩm khỏi giỏ hàng
    if (qty <= 0) {
      const deleteReq = new sql.Request();
      deleteReq.input('ChiTietGioHangID', sql.Int, chiTietGioHangId);
      
      const delResult = await deleteReq.query(
        'DELETE FROM ChiTietGioHang OUTPUT deleted.ChiTietGioHangID, deleted.GioHangID, deleted.SanPhamID WHERE ChiTietGioHangID = @ChiTietGioHangID'
      );

      if (delResult.recordset.length === 0) {
        return res.status(404).json({
          message: 'Không tìm thấy chi tiết giỏ hàng tương ứng để xóa'
        });
      }

      return res.status(200).json({
        message: 'Đã xóa sản phẩm khỏi giỏ hàng thành công (số lượng cập nhật bằng 0)',
        data: delResult.recordset[0]
      });
    }

    // 3. Kiểm tra sản phẩm và số lượng tồn kho
    const checkReq = new sql.Request();
    checkReq.input('ChiTietGioHangID', sql.Int, chiTietGioHangId);
    const checkResult = await checkReq.query(`
      SELECT ct.ChiTietGioHangID, ct.SanPhamID, sp.SoLuongTon, sp.TenSanPham
      FROM ChiTietGioHang ct
      JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
      WHERE ct.ChiTietGioHangID = @ChiTietGioHangID
    `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin chi tiết giỏ hàng tương ứng'
      });
    }

    const cartItem = checkResult.recordset[0];
    if (qty > cartItem.SoLuongTon) {
      return res.status(400).json({
        message: `Số lượng cập nhật (${qty}) vượt quá số lượng tồn kho khả dụng (${cartItem.SoLuongTon}) của sản phẩm ${cartItem.TenSanPham}`
      });
    }

    // 4. Cập nhật số lượng mới trong ChiTietGioHang
    const updateReq = new sql.Request();
    updateReq.input('ChiTietGioHangID', sql.Int, chiTietGioHangId);
    updateReq.input('SoLuong', sql.Int, qty);

    const result = await updateReq.query(`
      UPDATE ChiTietGioHang
      SET SoLuong = @SoLuong
      OUTPUT inserted.ChiTietGioHangID, inserted.GioHangID, inserted.SanPhamID, inserted.SoLuong
      WHERE ChiTietGioHangID = @ChiTietGioHangID
    `);

    return res.status(200).json({
      message: 'Cập nhật số lượng sản phẩm thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong capNhatGioHang:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi cập nhật giỏ hàng',
      error: error.message
    });
  }
};

/**
 * DELETE /giohang/:id
 * Xóa một sản phẩm ra khỏi giỏ hàng theo ChiTietGioHangID.
 */
const xoaKhoiGioHang = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: 'Thiếu ChiTietGioHangID cần xóa'
      });
    }

    const request = new sql.Request();
    request.input('ChiTietGioHangID', sql.Int, id);

    const result = await request.query(
      'DELETE FROM ChiTietGioHang OUTPUT deleted.ChiTietGioHangID, deleted.GioHangID, deleted.SanPhamID, deleted.SoLuong WHERE ChiTietGioHangID = @ChiTietGioHangID'
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm trong giỏ hàng hoặc sản phẩm đã bị xóa trước đó'
      });
    }

    return res.status(200).json({
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Lỗi trong xoaKhoiGioHang:', error);
    return res.status(500).json({
      message: 'Lỗi hệ thống khi xóa sản phẩm khỏi giỏ hàng',
      error: error.message
    });
  }
};

module.exports = {
  getGioHangByNguoiDungId,
  themVaoGioHang,
  capNhatGioHang,
  xoaKhoiGioHang
};
