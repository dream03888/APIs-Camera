const nodemon = require("nodemon");
const { pool } = require("../initial");
const mysql = require("mysql2/promise"); // ✅
const bcrypt = require("bcryptjs");

const getZone = async () => {
  const queryStr = `SELECT  COUNT(*) as count FROM zone `;
  try {
    const [rows, fields] = await pool.query(queryStr);
    if (rows.length < 1) {
      return { status: 200, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};
const getZones = async () => {
  const queryStr = `SELECT  zone_id , zone_name FROM zone `;
  try {
    const [rows, fields] = await pool.query(queryStr);
    if (rows.length < 1) {
      return { status: 200, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};
const getCameraByZone = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const queryStr = `
    SELECT 
      camera_id,
      camera_point,
      camera_zone,
      camera_qty,
      camera_brand
    FROM camera_zone
    ORDER BY camera_id
    LIMIT ? OFFSET ?
  `;

  try {
    const [rows] = await pool.query(queryStr, [limit, offset]);

    // นับจำนวนทั้งหมด (ใช้คำนวณ total pages)
    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM camera_zone`
    );

    return {
      status: 200,
      msg: rows,
      total: countRow.total,
      page,
      limit,
    };
  } catch (error) {
    console.log("Error Function getCameraByZone():", error);
    return { status: 500, msg: error };
  }
};

const getCameraByZoneByCamera = async (camera_id) => {
  const queryStr = `
SELECT camera_id , camera_point , camera_zone , camera_qty , camera_brand ,zone_name FROM camera_zone
INNER JOIN zone ON camera_zone.camera_zone = zone.zone_id
WHERE camera_id = ?`;
  const queryValues = [camera_id];
  try {
    const [rows, fields] = await pool.query(queryStr, queryValues);
    if (rows.length < 1) {
      return { status: 200, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};

const getAndInsertData = async (camera_zone) => {
  const queryStr = `
SELECT camera_id , camera_point , camera_zone , camera_qty , camera_brand ,zone_name ,zone.zone_id FROM camera_zone
INNER JOIN zone ON camera_zone.camera_zone = zone.zone_id
WHERE camera_zone = ?`;
  const queryValues = [camera_zone];
  try {
    const [rows, fields] = await pool.query(queryStr, queryValues);
    if (rows.length < 1) {
      return { status: 200, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};

// =========================
// INSERT Transaction
// =========================
// const reqTotransactionItemsReceiveWaitPo = async (ticketname, emp_code, camera_zone, camera_point, items) => {
//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();

//     // ✅ Insert parent
//     const queryStr = `
//       INSERT INTO transaction_checklist (ticket_name, emp_code, camera_zone, camera_point)
//       VALUES (?, ?, ?, ?)
//     `;
//     const [result] = await conn.query(queryStr, [ticketname, emp_code, camera_zone, camera_point]);

//     const insertedId = result.insertId; // ✅ FK ของ transaction_items

//     // ✅ Insert child (loop items)
//     for (let data of items) {
//       const queryStr$ = `
//         INSERT INTO transaction_items (transaction_id, item_id, status, qty, remark)
//         VALUES (?, ?, ?, ?, ?)
//       `;
//       const queryValues$ = [
//         insertedId,
//         data.item_id, // กัน null
//         data.status ,
//         1,
//         data.remark
//       ];

//       await conn.query(queryStr$, queryValues$);
//     }

//     await conn.commit();
//     await update_serial(ticketname);
//     return { status: 200, msg: 'success', transaction_id: insertedId };

//   } catch (err) {
//     await conn.rollback();
//     console.error('Error in transaction:', err);
//     return { status: 400, msg: err };
//   } finally {
//     conn.release();
//   }
// };

const reqTotransactionItemsReceiveWaitPo = async (transaction) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ Insert parent
    const queryStr = `
      INSERT INTO transaction_checklist (start_date,end_date,emp_code)
      VALUES ( ?, ?, ?)
    `;
    const [result] = await conn.query(queryStr, [
      transaction.start_date,
      transaction.end_date,
      transaction.emp_code,
    ]);

    const insertedId = result.insertId; // ✅ FK ของ transaction_items

    const items = await getAndInsertData(transaction.zone_id);

    if (items.status === 200 && items.msg.length > 0) {
      console.log(items.msg, "555555555555");
      for (let cam of items.msg) {
        console.log(cam.camera_qty, "555555555555");

        const qty = cam.camera_qty || 0; // ✅ qty ของกล้องแต่ละตัว
        for (let i = 0; i < qty; i++) {
          console.log(i, "555555555555");

          const queryStr$ = `
                    INSERT INTO transaction_items (transaction_id, item_id, qty, camera_id , zone_id)
                    VALUES (?, ?, ?, ?,?)
                  `;

          const queryValues$ = [
            insertedId,
            i + 1, // running index
            1,
            cam.camera_id, // ✅ ใช้ camera_id ของแต่ละตัว
            cam.zone_id,
          ];

          await conn.query(queryStr$, queryValues$);
        }
      }
    }

    await conn.commit();
    return { status: 200, msg: "success", transaction_id: insertedId };
  } catch (err) {
    await conn.rollback();
    console.error("Error in transaction:", err);
    return { status: 400, msg: err };
  } finally {
    conn.release();
  }
};

async function update_serial(data) {
  const split = data.split("-");
  const queryStr = `UPDATE ticketname SET tiket_qty=tiket_qty + 1 WHERE ticket_name='${split[0]}-${split[1]}';`;
  try {
    const [result, fields] = await pool.query(queryStr);
    // console.log(result);
    return { status: 200, msg: result };
  } catch (error) {
    console.error("Mysql error", error);
    throw error;
  }
}

const getTicket = async () => {
  const queryStr = `
    SELECT CONCAT(ticket_name, '-', tiket_qty) as ticket_name
    FROM ticketname
    ORDER BY date DESC
    LIMIT 1
  `;
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
//----------------------------------login
const LoginUser = async (user_id, password) => {
  console.log("Login attempt:", user_id, password);

  const queryStr = `
    SELECT user_login.*, role_name eeeeeeeeee
    FROM user_login
    INNER JOIN tbl_role on user_login.role = tbl_role.id
    WHERE emp_code = ? OR staff_name = ?
  `;
  const queryValues = [user_id, user_id];

  try {
    const [rows] = await pool.query(queryStr, queryValues);

    if (rows.length < 1) {
      return { status: 202, msg: "User not found" };
    }

    const user = rows[0];

    // 🔑 เช็ค password ด้วย bcrypt
    // const isMatch = await bcrypt.compare(password, user.password);
    // console.log(isMatch,user.password)
    // if (!isMatch) {
    //   return { status: 401, msg: "Invalid password" };
    // }

    // ✅ success
    return { status: 200, msg: rows };
  } catch (error) {
    console.error("Error Function LoginUser(): " + error);
    return { status: 500, msg: error };
  }
};

const Register_user = async (users) => {
  console.log(users);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(users.password, salt);
    console.log(hashedPassword);
    // ✅ Insert parent
    const queryStr = `
      INSERT INTO user_login (staff_name, emp_code,password,role)
      VALUES (?, ?, ?, ?)
    `;
    const queryValues = [
      users.staff_name,
      users.emp_code,
      hashedPassword,
      users.role,
    ];
    await conn.query(queryStr, queryValues);

    // const insertedId = result.insertId; // ✅ FK ของ transaction_items

    await conn.commit();
    return { status: 200, msg: "success" };
  } catch (err) {
    await conn.rollback();
    console.error("Error in transaction:", err);
    return { status: 400, msg: err };
  } finally {
    conn.release();
  }
};

//------------------------- My-Request

const Myrequest_transaction = async () => {
  const queryStr = `
      WITH camera_list AS (
    SELECT
        transaction_items.transaction_id,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', transaction_items.id,
                'transaction_id', transaction_items.transaction_id,
                'status', transaction_items.status,
                'qty', transaction_items.qty,
                'remark', transaction_items.remark,
                'camera_id', transaction_items.camera_id,
                'camera_point', camera_zone.camera_point,
                'camera_zone', camera_zone.camera_zone,
                'camera_qty', camera_zone.camera_qty,
                'camera_brand', camera_zone.camera_brand,
                  'status' , transaction_items.status
            )
            ORDER BY transaction_items.camera_id ASC   -- ✅ MariaDB รองรับ ORDER BY ใน JSON_ARRAYAGG
        ) as lists
    FROM transaction_items
    INNER JOIN camera_zone 
        ON transaction_items.camera_id = camera_zone.camera_id
    GROUP BY transaction_items.transaction_id
        ORDER BY transaction_items.camera_id ASC

)
SELECT 
    transaction_checklist.transaction_id,
    transaction_checklist.ticket_name,
    transaction_checklist.start_date,
    transaction_checklist.end_date,
    transaction_checklist.complete_date,
    transaction_checklist.emp_code,
    transaction_checklist.completed,
    camera_list.lists,
    zone.zone_name,
    zone.zone_id
FROM transaction_checklist
INNER JOIN camera_list 
    ON transaction_checklist.transaction_id = camera_list.transaction_id
    INNER JOIN transaction_items ON transaction_checklist.transaction_id = transaction_items.transaction_id
    left JOIN camera_zone ON transaction_items.camera_id = camera_zone.camera_zone
    left JOIN zone ON camera_zone.camera_zone = zone.zone_id 
-- WHERE transaction_checklist.emp_code = ?
GROUP BY transaction_checklist.transaction_id;;
  `;
  try {
    const [rows, fields] = await pool.query(queryStr);
    if (rows.length < 1) {
      return { status: 202, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};

const Myrequest_Bytransaction = async (transaction_id) => {
  const queryStr = `
   SELECT camera_zone.camera_id,transaction_items.transaction_id,status,camera_point,camera_brand,camera_qty,zone_name,zone_id , transaction_checklist.ticket_name FROM transaction_items
INNER JOIN camera_zone ON camera_zone.camera_id = transaction_items.camera_id
INNER JOIN zone ON camera_zone.camera_zone = zone.zone_id
INNER JOIN transaction_checklist ON transaction_items.transaction_id = transaction_checklist.transaction_id
WHERE transaction_items.transaction_id = ?
GROUP BY transaction_items.camera_id;  -- ✅ ย้าย WHERE มาที่นี่


  `;
  const queryValues = [transaction_id];
  try {
    const [rows, fields] = await pool.query(queryStr, queryValues);
    if (rows.length < 1) {
      return { status: 202, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};

const CheckList_camera = async (camera_id, transaction_id) => {
  const queryStr = `
   SELECT transaction_items.id,
transaction_items.transaction_id,
transaction_items.item_id,
transaction_items.status,
transaction_items.remark,
camera_zone.camera_brand,
camera_zone.camera_point ,
zone.zone_name,
transaction_items.nvr_id,
tbl_nvr.nvr_name
FROM transaction_items
INNER JOIN camera_zone ON transaction_items.camera_id = camera_zone.camera_id
INNER JOIN zone ON camera_zone.camera_zone = zone.zone_id
LEFT JOIN tbl_nvr ON transaction_items.nvr_id = tbl_nvr.nvr_id
WHERE camera_zone.camera_id = ? AND transaction_id = ?;  -- ✅ ย้าย WHERE มาที่นี่


  `;
  const queryValues = [camera_id, transaction_id];
  try {
    const [rows, fields] = await pool.query(queryStr, queryValues);
    if (rows.length < 1) {
      return { status: 202, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};

async function Update_checklist(data) {
  const conn = await pool.getConnection();
  try {
    const queryStr$ = `
        UPDATE transaction_items 
        SET status = ?, remark = ? , date = CURRENT_TIMESTAMP , nvr_id = ? 
        WHERE id = ? AND transaction_id = ?
      `;
    const queryValues$ = [
      data.status,
      data.remark,
      data.nvr,
      data.id,
      data.transaction_id,
    ];

    await conn.query(queryStr$, queryValues$);

    return { status: 200, msg: "Update success" };
  } catch (error) {
    console.error("Mysql error", error);
    return { status: 400, msg: error };
  } finally {
    conn.release();
  }
}

async function Update_transaction(data) {
  console.log("Datasss", data);
  const conn = await pool.getConnection();
  try {
    for (let items of data) {
      const queryStr$ = `
        UPDATE transaction_checklist 
        SET  completed = true
        WHERE  transaction_id = ?
      `;
      const queryValues$ = [items.transaction_id];
      await conn.query(queryStr$, queryValues$);
    }
    return { status: 200, msg: "Update success" };
  } catch (error) {
    console.error("Mysql error", error);
    return { status: 400, msg: error };
  } finally {
    conn.release();
  }
}

async function finish(transaction_id) {
  const conn = await pool.getConnection();
  try {
    const queryStr$ = `
        UPDATE transaction_checklist 
        SET  completed = true , complete_date = CURRENT_DATE
        WHERE  transaction_id = ?
      `;
    const queryValues$ = [transaction_id];
    await conn.query(queryStr$, queryValues$);

    return { status: 200, msg: "Update success" };
  } catch (error) {
    console.error("Mysql error", error);
    return { status: 400, msg: error };
  } finally {
    conn.release();
  }
}

const HistoryByUSer = async (camera_id) => {
  console.log(camera_id);
  const queryStr = `
       SELECT 
    transaction_checklist.transaction_id,
    transaction_checklist.ticket_name,
    transaction_checklist.start_date,
    transaction_checklist.end_date,
    transaction_checklist.complete_date,
    transaction_checklist.emp_code,
    transaction_checklist.completed,
     user_login.staff_name
FROM transaction_checklist
INNER JOIN transaction_items ON transaction_checklist.transaction_id = transaction_items.transaction_id
    INNER JOIN user_login ON user_login.emp_code =  transaction_checklist.emp_code
    WHERE transaction_items.camera_id = ?
    GROUP BY transaction_checklist.transaction_id

;
  `;
  const queryValues = [camera_id];
  try {
    const [rows, fields] = await pool.query(queryStr, queryValues);
    if (rows.length < 1) {
      return { status: 202, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};

const History_data_user = async (camera_id, transaction_id) => {
  const queryStr = `
    SELECT
        transaction_items.transaction_id,
       
                transaction_items.id,
                transaction_items.transaction_id,
                transaction_items.status,
                transaction_items.qty,
                transaction_items.remark,
                 transaction_items.item_id,
                 transaction_items.camera_id,
                 camera_zone.camera_point,
                 camera_zone.camera_zone,
                camera_zone.camera_qty,
                 camera_zone.camera_brand,
                zone.zone_name,
                transaction_items.date 
    FROM transaction_items
    INNER JOIN camera_zone 
        ON transaction_items.camera_id = camera_zone.camera_id
    INNER JOIN zone 
        ON camera_zone.camera_zone = zone.zone_id
    WHERE transaction_items.camera_id = ? AND transaction_items.transaction_id = ?;  -- ✅ ย้าย WHERE มาที่นี่


  `;
  const queryValues = [camera_id, transaction_id];
  try {
    const [rows, fields] = await pool.query(queryStr, queryValues);
    if (rows.length < 1) {
      return { status: 202, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};

const insert_Camara_zone = async (cameras) => {
  console.log(cameras);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ Insert paren
    const queryStr = `
      INSERT INTO camera_zone (camera_point, camera_zone,camera_qty,camera_brand)
      VALUES (?, ?, ?, ?)
    `;
    const queryValues = [
      cameras.camera_point,
      cameras.camera_zone,
      cameras.camera_qty,
      cameras.camera_brand,
    ];
    await conn.query(queryStr, queryValues);

    // const insertedId = result.insertId; // ✅ FK ของ transaction_items

    await conn.commit();
    return { status: 200, msg: "success" };
  } catch (err) {
    await conn.rollback();
    console.error("Error in transaction:", err);
    return { status: 400, msg: err };
  } finally {
    conn.release();
  }
};

const insert_zone = async (zone_nzme) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ Insert paren
    const queryStr = `
      INSERT INTO zone (zone_name)
      VALUES (?)
    `;
    const queryValues = [zone_nzme];
    await conn.query(queryStr, queryValues);

    // const insertedId = result.insertId; // ✅ FK ของ transaction_items

    await conn.commit();
    return { status: 200, msg: "success" };
  } catch (err) {
    await conn.rollback();
    console.error("Error in transaction:", err);
    return { status: 400, msg: err };
  } finally {
    conn.release();
  }
};

const ErrorCamera = async () => {
  const queryStr = `SELECT id,
transaction_id,
status,
qty,
remark,
transaction_items.camera_id,
camera_point,
camera_brand,
date,
zone.zone_id,
zone.zone_name
 FROM transaction_items
INNER JOIN camera_zone ON transaction_items.camera_id = camera_zone.camera_id
INNER JOIN zone ON transaction_items.zone_id = zone.zone_id
WHERE status IN (2,3);`;
  try {
    const [rows, fields] = await pool.query(queryStr);
    if (rows.length < 1) {
      return { status: 202, msg: [] };
    }
    return { status: 200, msg: rows };
  } catch (error) {
    console.log("Error Function getZone(): " + error);
    return { status: 201, msg: error };
  }
};

module.exports = {
  getZone,
  getCameraByZone,
  getCameraByZoneByCamera,
  reqTotransactionItemsReceiveWaitPo,
  getTicket,
  LoginUser,
  Myrequest_transaction,
  Myrequest_Bytransaction,
  CheckList_camera,
  Update_checklist,
  finish,
  HistoryByUSer,
  History_data_user,
  Register_user,
  insert_Camara_zone,
  insert_zone,
  getZones,
  Update_transaction,
  ErrorCamera
};
