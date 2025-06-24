import { infoDb } from "../const/const.js";
import { createClient } from "@libsql/client";

const db = createClient(infoDb);

export class paymentRepository {
  static async registerPayment({ price, paymentMethod, transactionId, rsvId }) {
    verifyPayment.validatePaymentMethod(paymentMethod);
    console.log(price, paymentMethod, rsvId, transactionId);
    await db.execute(
      "INSERT INTO payments(rsv_id,price,payment_method,transaction_id) VALUES(?,?,?,?)",
      [rsvId, price, paymentMethod, transactionId]
    );
  }
  static async patchPaymenth({ price, paymentMethod, transactionId, rsvId }) {
    verifyPayment.validatePaymentMethod(paymentMethod);
    await db.execute(
      "UPDATE payments SET rsv_id = ?, price = ?, payment_method = ? WHERE transaction_id = ?",
      [rsvId, price, paymentMethod, transactionId]
    );
  }
  static async deletePayment({ transactionId }) {
    await db.execute("DELETE FROM payments WHERE transaction_id = ?", [
      transactionId,
    ]);
  }
  static async getPayments(userId) {
    const result = await db.execute(
      "SELECT p.rsv_id, p.price, p.payment_method, p.transaction_id, r.name, r.lastname, r.username, r.email, h.hotel_id, h.user_id FROM payments p JOIN reservations r ON p.rsv_id = r.id  JOIN hoteles h ON r.hotel_id = h.id WHERE h.user_id = ?",
      [userId]
    );
    return result.rows;
  }
}

class verifyPayment {
  static validatePaymentMethod(paymentMethod) {
    const validMethods = ["credit_card", "paypal", "bank_transfer"];
    if (!validMethods.includes(paymentMethod)) {
      throw new Error("Invalid payment method");
    }
  }
}
