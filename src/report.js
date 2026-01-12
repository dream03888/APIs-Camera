const SumCameraQty = async () => {
  const queryStr = `
    SELECT SUM(camera_qty) as qty FROM camera_zone;`;
  try {
    const [rows] = await pool.query(queryStr);
    if (rows.length < 1) {
      return { status: 200, msg: null }; // ไม่มีข้อมูล
    }
    // ✅ ส่งเฉพาะค่า ticket_name
    return { status: 200, msg: rows[0].ticket_name };
  } catch (error) {
    console.log("Error Function getTicket(): " + error);
    return { status: 500, msg: error };
  }
};


const CountZone = async () => {
  const queryStr = `SELECT COUNT(*) as total_zone FROM zone;`;
  try {
    const [rows] = await pool.query(queryStr);
    if (rows.length < 1) {
      return { status: 200, msg: null }; // ไม่มีข้อมูล
    }
    // ✅ ส่งเฉพาะค่า ticket_name
    return { status: 200, msg: rows[0].ticket_name };
  } catch (error) {
    console.log("Error Function getTicket(): " + error);
    return { status: 500, msg: error };
  }
};