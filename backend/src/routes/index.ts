import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import * as booking from "../controllers/booking.controller";
import * as schedule from "../controllers/schedule.controller";
import * as services from "../controllers/services.controller";
import * as payment from "../controllers/payment.controller";
import * as customers from "../controllers/customer.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

function authRoutes(): Router {
  const router = Router();
  router.post("/register", asyncHandler(auth.register));
  router.post("/login", asyncHandler(auth.login));
  router.post("/logout", asyncHandler(auth.logout));
  router.post("/refresh", requireAuth, asyncHandler(auth.refresh));
  router.get("/me", requireAuth, asyncHandler(auth.me));
  router.put("/profile", requireAuth, asyncHandler(auth.updateProfile));
  router.put("/password", requireAuth, asyncHandler(auth.updatePassword));
  return router;
}

function serviceRoutes(): Router {
  const router = Router();
  router.use(requireAuth);
  router.get("/", asyncHandler(services.listServices));
  router.get("/:id", asyncHandler(services.getService));
  router.post("/", asyncHandler(services.createService));
  router.put("/:id", asyncHandler(services.updateService));
  router.patch("/:id", asyncHandler(services.updateService));
  router.delete("/:id", asyncHandler(services.deleteService));
  router.patch("/:id/toggle", asyncHandler(services.toggleService));
  return router;
}

function scheduleRoutes(spanish: boolean): Router {
  const router = Router();
  router.use(requireAuth);
  if (spanish) {
    router.get("/dias-libres", asyncHandler(schedule.listDaysOff));
    router.post("/dias-libres", asyncHandler(schedule.addDayOff));
    router.delete("/dias-libres/:id", asyncHandler(schedule.removeDayOff));
  } else {
    router.get("/unavailable", asyncHandler(schedule.listDaysOff));
    router.post("/unavailable", asyncHandler(schedule.addDayOff));
    router.delete("/unavailable/:id", asyncHandler(schedule.removeDayOff));
  }
  router.get("/", asyncHandler(schedule.listSchedule));
  router.post("/", asyncHandler(schedule.updateSchedule));
  router.put("/:idx", asyncHandler(schedule.updateSchedule));
  router.patch("/:idx", asyncHandler(schedule.updateSchedule));
  return router;
}

function bookingRoutes(): Router {
  const router = Router();
  router.post("/availability", asyncHandler(booking.getAvailability));
  router.post("/disponibilidad", asyncHandler(booking.getAvailability));
  // router.post("/", asyncHandler(booking.createBooking));
  router.get("/", requireAuth, asyncHandler(booking.listBookings));
  router.get("/stats", requireAuth, asyncHandler(booking.bookingStats));
  router.get("/:id", requireAuth, asyncHandler(booking.getBooking));
  router.patch("/:id", requireAuth, asyncHandler(booking.updateBooking));
  router.put("/:id/cancel", requireAuth, (req, _res, next) => {
    req.params.action = "cancel";
    next();
  }, asyncHandler(booking.transitionBooking));
  router.put("/:id/complete", requireAuth, (req, _res, next) => {
    req.params.action = "complete";
    next();
  }, asyncHandler(booking.transitionBooking));
  router.put("/:id/no-show", requireAuth, (req, _res, next) => {
    req.params.action = "no-show";
    next();
  }, asyncHandler(booking.transitionBooking));
  return router;
}

// function paymentRoutes(): Router {
//   const router = Router();
//   router.use(requireAuth);
//   router.get("/:bookingId", asyncHandler(payment.getPayment));
//   router.post("/link", asyncHandler(payment.createPaymentLink));
//   return router;
// }

function customerRoutes(): Router {
  const router = Router();
  router.use(requireAuth);
  router.get("/", asyncHandler(customers.listCustomers));
  router.get("/:id", asyncHandler(customers.getCustomer));
  router.patch("/:id", asyncHandler(customers.updateCustomer));
  return router;
}

export function createApiRouter(): Router {
  const api = Router();
  api.use("/auth", authRoutes());
  api.use("/servicios", serviceRoutes());
  api.use("/horario", scheduleRoutes(true));
  api.use("/citas", bookingRoutes());
  // api.use("/pagos", paymentRoutes());
  api.use("/clientes", customerRoutes());
  api.post("/webhook/payment", asyncHandler(payment.paymentWebhook));
  return api;
}

export function createVersionedRouter(): Router {
  const api = Router();
  api.use("/auth", authRoutes());
  api.use("/services", serviceRoutes());
  api.use("/schedule", scheduleRoutes(false));
  api.use("/bookings", bookingRoutes());
  // api.use("/payments", paymentRoutes());
  api.use("/customers", customerRoutes());
  api.post("/webhook/payment", asyncHandler(payment.paymentWebhook));
  return api;
}
