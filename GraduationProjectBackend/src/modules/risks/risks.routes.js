import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { approveRisk, createRisk, listRisks, requestRiskRevision, updateRisk } from "./risks.controller.js";
import {
  approveRiskSchema,
  createRiskSchema,
  listRisksSchema,
  requestRiskRevisionSchema,
  updateRiskSchema,
} from "./risks.schema.js";

const router = Router();

router.use(auth);

router.get("/", validate(listRisksSchema), listRisks);
router.post("/", validate(createRiskSchema), createRisk);
router.patch("/:id", validate(updateRiskSchema), updateRisk);
router.post("/:id/approve", validate(approveRiskSchema), approveRisk);
router.post("/:id/request-revision", validate(requestRiskRevisionSchema), requestRiskRevision);

export default router;
