import { Router } from "express";
import { productController } from "../controllers/product.controller.js";

// Assumes your auth middleware already sets req.user = { id, companyId, role }.
const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "EXPORT_MANAGER"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

const allow = (roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to do this" });

const router = Router();

router.get("/", productController.list);
router.get("/categories", productController.categories); // keep above "/:id"
router.get("/:id", productController.get);
router.post("/", allow(WRITE_ROLES), productController.create);
router.patch("/:id", allow(WRITE_ROLES), productController.update);
router.delete("/:id", allow(DELETE_ROLES), productController.remove);

export default router;

// app.js / server.js:
//   import productRoutes from "./routes/product.routes.js";
//   app.use("/api/products", authenticate, productRoutes);
