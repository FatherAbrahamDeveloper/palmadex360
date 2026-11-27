import { Router } from "express";
import { productController } from "../controllers/product.controller.js";

// Assumes your auth middleware already sets req.user = { id, companyId, role }.


// Access is checked by requireAccess(<module>) where this router is mounted (app.js):
// reads need VIEW, creates and updates EDIT, deletes FULL.
const router = Router();

router.get("/", productController.list);
router.get("/categories", productController.categories); // keep above "/:id"
router.get("/:id", productController.get);
router.post("/", productController.create);
router.patch("/:id", productController.update);
router.delete("/:id", productController.remove);

export default router;

// app.js / server.js:
//   import productRoutes from "./routes/product.routes.js";
//   app.use("/api/products", authenticate, productRoutes);
