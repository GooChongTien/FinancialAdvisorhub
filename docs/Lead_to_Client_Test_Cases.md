# ✅ Lead-to-Client Positive Test Cases
Each test case below represents a **successful journey** that results in a new **Client record** in the Customer module.

---

### 🧩 **Lead Creation to Client Conversion Checklist (30 Test Cases)**

#### **Lead Creation & Conversion (01–10)**

- [ ] **TC01** – Create lead → Complete Term Life plan → Submit → Issue → **Client created**
- [ ] **TC02** – Create lead with appointment → Fact Find → Recommend plan → Issue → **Client created**
- [ ] **TC03** – Married with child → Dependents captured → Family Term plan → Issue → **Client created**
- [ ] **TC04** – RPQ Aggressive → ILP recommended → Issue → **Client created**
- [ ] **TC05** – 10% affordability → Endowment plan within range → Issue → **Client created**
- [ ] **TC06** – CI need gap → Recommend Critical Illness plan → Issue → **Client created**
- [ ] **TC07** – Hospitalisation plan (H&S) → Issue → **Client created**
- [ ] **TC08** – Disability income plan → Issue → **Client created**
- [ ] **TC09** – Education savings for child → Goal set → Plan issued → **Client created**
- [ ] **TC10** – Retirement annuity → Issue → **Client created**

---

#### **Existing Coverage & Source Variants (11–15)**

- [ ] **TC11** – Capture existing policies → Recommend top-up → Issue → **Client created**
- [ ] **TC12** – Lead source = Campaign → Full flow → Issue → **Client created**
- [ ] **TC13** – Lead source = Referral → Full flow → Issue → **Client created**
- [ ] **TC14** – Corporate employee → Fact Find → Recommend plan → Issue → **Client created**
- [ ] **TC15** – Smoker = Yes → Smoker-rated product → Issue → **Client created**

---

#### **Personal Detail & RPQ Variants (16–20)**

- [ ] **TC16** – Non-local nationality → Plan issued → **Client created**
- [ ] **TC17** – Start Fact Find from existing Client → Add policy → **Client retained (no duplicate)**
- [ ] **TC18** – Weekend appointment → Complete & issue → **Client created**
- [ ] **TC19** – Re-generate quote once → Choose option 2 → Issue → **Client created**
- [ ] **TC20** – Add CI rider → Premium recalculates → Issue → **Client created**

---

#### **Application Details & Relationship Handling (21–25)**

- [ ] **TC21** – Joint application (spouse assured) → Issue → **Client created**
- [ ] **TC22** – Annual premium mode → Issue → **Client created**
- [ ] **TC23** – Monthly premium via card → Issue → **Client created**
- [ ] **TC24** – Add beneficiaries → Issue → **Client created**
- [ ] **TC25** – Upload existing policy docs → Issue → **Client created**

---

#### **Post-Issue & Portfolio Verification (26–30)**

- [ ] **TC26** – Two products in one proposal → Issue → **Client created with multiple policies**
- [ ] **TC27** – Lead progresses to Won → Status audit saved → **Client created**
- [ ] **TC28** – Edit contact info post-issue → Save → **Client retained, info updated**
- [ ] **TC29** – View client tabs (Overview/Portfolio/Servicing/Gap) → **All accessible**
- [ ] **TC30** – Existing Client adds new proposal → Issue → **Portfolio expands; client unchanged**

---

### 📊 **Expected End State**
✅ 30 client records visible in **Customer Module → Filter: Type = Client**  
✅ Each client has a valid **Overview** and **Portfolio** tab populated with at least one active policy  
✅ Total client count increased by **+30** from baseline
