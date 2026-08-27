# NextHire AI — Repository Phase Map

**Audit Date**: August 27, 2026  
**Auditor**: Senior ML Systems Architect & Engineering Auditor  
**Repository Source of Truth**: `e:\UserData\Documents\Next Hire`

---

## 1. Phase-to-Repository Mapping

```text
┌─────────┬───────────────────────────────────────────┬────────────────────────────────────────────────────────┬────────────────────────────────────────┐
│ Phase   │ Implemented Files / Directories           │ Test & Evaluation Files                                │ Missing Physical Artifacts             │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase A │ • src/lib/intelligence/types.ts           │ • scratch/test_phase14_executive_intelligence.js       │ None (Types and schemas mapped)        │
│         │ • src/lib/aiEngine.ts                     │ • scratch/full_qa_pass.ts                              │                                        │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase B │ • src/lib/mockData.ts                     │ • scratch/test_phase2_jobseeker_lifecycle.js           │ • data/NextHire-Eval-v1/ directory     │
│         │ • scratch/inspect_db_data.js              │ • scratch/test_phase3_recruiter_lifecycle.js           │   (250 JSON gold standard bundles)     │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase C │ • docs/audit/ (Research specifications)   │ • Architecture memory models in Phase C records        │ • Local model weight files (Qwen 14B)  │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase D │ • src/lib/privacy/ (Privacy & Retention)  │ • scratch/business-model-alignment-audit.mjs           │ • Executed legal counsel memos         │
│         │ • src/lib/security.ts                     │                                                        │                                        │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase E │ • src/lib/intelligence/historicalComp...  │ • scratch/master_verification.js                       │ • Offline benchmark run output logs    │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase F │ • src/lib/intelligence/types.ts           │ • scratch/strict-verification-audit.mjs                │ None (Portfolio mapping active)        │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase G │ • src/lib/aiEngine.ts (Prompt templates)  │ • scratch/verify_stage2_ui_resume.js                   │ • Static prompt files in dedicated dir │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase H │ • Decision record in brain metadata       │ • Evaluated against residual error analysis            │ None (Deferred by design)              │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase I │ • Lineage documentation in brain metadata │ • Reference PEFT configuration                         │ • .safetensors binary file (58.2 MB)   │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase J │ • src/app/api/recruiter/copilot/route.ts  │ • scratch/verify-copilot-positioning.mjs               │ • vLLM container orchestration script  │
│         │ • src/lib/copilot/ (Gateway logic)        │ • scratch/test_phase7_recruiter_copilot.js             │                                        │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase K │ • src/lib/intelligence/workloadEngine.ts  │ • scratch/test_phase11_hiring_funnel.js                │ None (100% Deterministic Engine code   │
│         │ • src/lib/intelligence/bottleneckDetec... │ • scratch/test_phase12_market_talent_intelligence.js   │   active and verified in src/lib)      │
│         │ • src/lib/intelligence/strategyEngine.ts  │ • scratch/test_phase10_interview_intelligence.js       │                                        │
│         │ • src/lib/intelligence/hiringFunnel.ts    │ • scratch/test_phase13_recruiter_collaboration.js      │                                        │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase L │ • src/app/recruiter/page.tsx              │ • scratch/real-account-e2e-acceptance.mjs              │ None (End-to-end integration verified) │
│         │ • src/components/ (Recruiter UI & Modals) │ • scratch/run-full-acceptance.mjs                      │                                        │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase M │ • src/components/ui/SubscriptionVerifi... │ • scratch/comprehensive-authorization-audit.mjs        │ • Signed legal contracts (TOS / DPA)   │
│         │ • src/lib/auth.ts (Manager controls)      │ • scratch/test-admin-sub.mjs                           │ • Third-party NYC bias audit report    │
├─────────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ Phase N │ • MANUAL_E2E_VERIFICATION_CHECKLIST.md    │ • scratch/full_qa_pass.js                              │ None (Gap closure framework complete)  │
│         │ • src/middleware.ts                       │ • scratch/test_final_production_verification.js        │                                        │
└─────────┴───────────────────────────────────────────┴────────────────────────────────────────────────────────┴────────────────────────────────────────┘
```
