const express = require("express");
const router = express.Router();

const { io } = require("./initial");
const zone = require("./src/camera-zone.js");

io.on("connection", (socket) => {
    console.log(`Socket connect id: ${socket.id}`);

    socket.on("get_zone", async () => {
        const result = await zone.getZone();
        socket.emit("return_get_zone", result);
    });




socket.on("get_camByzone", async (page = 1, limit = 10) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);

    const result = await zone.getCameraByZone(page, limit);

    socket.emit("return_camByzone", result);
    
  } catch (err) {
    socket.emit("return_camByzone", {
      status: 500,
      msg: err
    });
  }
});



        socket.on("get_camByzone_Byid", async (camera_id) => {
        const result = await zone.getCameraByZoneByCamera(camera_id);
        socket.emit("return_camByzone_Byid", result);
    });



    
    //     socket.on("insert_transaction", async (ticketname, emp_code, camera_zone,camera_point,items) => {
    //     const result = await zone.reqTotransactionItemsReceiveWaitPo(ticketname, emp_code, camera_zone,camera_point,items);
    //     socket.emit("return_insert_transaction", result);
    // });

        socket.on("insert_transaction", async (transaction) => {
        const result = await zone.reqTotransactionItemsReceiveWaitPo(transaction);
        socket.emit("return_insert_transaction", result);
    });


    socket.on("get_ticket", async () => {
        const result = await zone.getTicket();
        socket.emit("retrun_get_ticket", result);
    });

    //----------------------login
      socket.on("login_user", async (user_id,password) => {
        const result = await zone.LoginUser(user_id,password);
        socket.emit("return_login_user", result);
    });


     socket.on("register_login_user", async (users) => {
        const result = await zone.Register_user(users);
        socket.emit("return_register_login_user", result);
    });


    socket.on("insert_camera_zone", async (cameras) => {
        const result = await zone.insert_Camara_zone(cameras);
        socket.emit("return_insert_camera_zone", result);
    });

        socket.on("insert_zone", async (zone_name) => {
        const result = await zone.insert_zone(zone_name);
        socket.emit("return_insert_zone", result);
    });






//------- My-Request
      socket.on("get_my_request", async ()=> {
        const result = await zone.Myrequest_transaction();
        socket.emit("return_get_my_request", result);
    });

          socket.on("get_my_request_by_id", async (transaction_id)=> {
        const result = await zone.Myrequest_Bytransaction(transaction_id);
        socket.emit("return_get_my_request_by_id", result);
    });

         socket.on("check_list_data", async (camera_id,transaction_id)=> {
        const result = await zone.CheckList_camera(camera_id,transaction_id);
        socket.emit("return_check_list_data", result);
    });


        socket.on("update_datalist", async (data)=> {
        const result = await zone.Update_checklist(data);
        socket.emit("return_update_datalist", result);
    });


          socket.on("Update_transaction", async (data)=> {
        const result = await zone.Update_transaction(data);
        socket.emit("return_Update_transaction", result);
    });

        socket.on("finish", async (transaction_id)=> {
        const result = await zone.finish(transaction_id);
        socket.emit("return_status_finish", result);
    });



        socket.on("history_report", async (camera_id)=> {
        const result = await zone.HistoryByUSer(camera_id);
        socket.emit("return_history_report", result);
    });


      socket.on("history_report_user", async (camera_id , transaction_id)=> {
        const result = await zone.History_data_user(camera_id,transaction_id);
        socket.emit("return_history_report_user", result);
    });

   socket.on("req_zones", async ()=> {
        const result = await zone.getZones();
        socket.emit("return_req_zones", result);
    });



 socket.on("error_camera", async ()=> {
        const result = await zone.ErrorCamera();
        socket.emit("return_error_camera", result);
    });



});
