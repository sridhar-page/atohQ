# Business Requirement Document (BRD): Digital Queue Management SaaS

**Project Name:** Q-Ease (Conceptual)  
**Version:** 1.0  
**Status:** Draft  
**Author:** Senior Product Manager  

---

## 1. Problem Statement
Small to medium-sized clinics currently rely on physical queues or manual token systems. This leads to:
- **Patient Frustration:** Waiting for hours in crowded rooms increases stress and risk of cross-infection.
- **Opacity:** Patients have no visibility into the actual wait time or their position in the queue.
- **Operational Inefficiency:** Receptionists spend excessive time managing angry patients and manual logs.
- **No-Shows:** Patients leave without notice, causing idle time for doctors.

## 2. Goals
- **Eliminate Physical Waiting:** Allow patients to wait in more comfortable environments (home, coffee shop) until their turn is near.
- **Improve Transparency:** Provide real-time queue status and estimated wait times.
- **Enhance Clinic Efficiency:** Automate token generation, reminders, and no-show management.
- **Scalable SaaS:** Build a multi-tenant platform that can eventually serve salons, restaurants, and other service-based businesses.

---

## 3. Functional Requirements

### 3.1 Patient Module
| ID | Requirement | Description |
|:---|:---|:---|
| F1.1 | Join Queue | Join via web/mobile using Name + Phone Number (no app download required). |
| F1.2 | Token Generation | Receive a unique alpha-numeric token (e.g., A-12, B-05). |
| F1.3 | Live Status | Real-time view of current token being called and tokens ahead. |
| F1.4 | Wait Time Estimation | Dynamic estimation based on average service time of the doctor. |
| F1.5 | Notifications | SMS/WhatsApp/Push alerts at thresholds: 10, 5, 2, 1, and "Your Turn". |
| F1.6 | Cancel Token | Ability to drop out of the queue via the status page. |

### 3.2 Receptionist Module
| ID | Requirement | Description |
|:---|:---|:---|
| F2.1 | Walk-in Tokens | Manually add patients to the queue for those without smartphones. |
| F2.2 | Token Management | Cancel tokens or mark a patient as a "No-Show". |
| F2.3 | Queue Control | Pause/Resume the queue for specific services or doctors. |
| F2.4 | Prioritization | "Emergency" or "VIP" flag to move a token to the top of the queue. |
| F2.5 | View Log | History of tokens served, cancelled, or skipped during the shift. |

### 3.3 Doctor Module
| ID | Requirement | Description |
|:---|:---|:---|
| F3.1 | Call Next | Single-click action to call the next available token. |
| F3.2 | Pause Queue | Temporary pause for breaks or emergencies. |
| F3.3 | Queue View | At-a-glance count of pending patients and average wait time. |
| F3.4 | Re-call | Re-send notification to a patient who didn't appear immediately. |

### 3.4 Admin (Clinic Owner) Module
| ID | Requirement | Description |
|:---|:---|:---|
| F4.1 | Service Config | Define services (e.g., General, Dental, X-Ray) with default durations. |
| F4.2 | Staff Management | Add/Remove Receptionists and Doctors. |
| F4.3 | Business Rules | Configure working hours, holidays, and auto-reset times. |
| F4.4 | Reports | Analytics: Avg wait time, Peak hours, No-show rates, Patient volume. |
| F4.5 | Billing | Manage subscriptions, apply coupons, and view invoices. |

### 3.5 Platform (SaaS Core)
| ID | Requirement | Description |
|:---|:---|:---|
| F5.1 | Multi-tenancy | Data isolation between different clinics. |
| F5.2 | Tenant Branding | Upload logo and set primary theme color. |
| F5.3 | Subscription Mgmt | Tiered pricing (Free Trial, Pro, Enterprise). |
| F5.4 | Coupon Engine | Support for promotional codes for new clinics. |
| F5.5 | Voice-over Demo | Automated walkthrough for new users with audio guidance. |

---

## 4. Non-Functional Requirements
- **Availability:** 99.9% uptime for the patient status page.
- **Scalability:** Handle sudden spikes in traffic (e.g., Monday mornings at a large clinic).
- **Security:** HIPAA-compliant data storage (or regional equivalent) for patient privacy.
- **Latency:** Real-time updates to the queue within < 2 seconds.
- **Responsiveness:** Works seamlessly on mobile-first web browsers.

---

## 5. User Journeys

### 5.1 The Digital Patient
1. Patient scans QR code at the clinic entrance or visits the clinic's URL.
2. Enters Name and Phone.
3. Receives Token #A-15.
4. Leaves to get coffee nearby.
5. Receives SMS: "5 people ahead of you. Est. wait: 15 mins."
6. Receives SMS: "It's your turn! Please report to Reception."
7. Patient arrives just in time for the consultation.

### 5.2 The Busy Receptionist
1. Receptionist sees 10 patients in the "Dental" queue.
2. A walk-in elderly patient arrives; Receptionist manually adds them.
3. An emergency arrives; Receptionist uses the "Prioritize" button to move them to #1.
4. Doctor 2 goes on a lunch break; Receptionist hits "Pause" for the "General" queue.

---

## 6. Edge Cases
- **No-Show Recovery:** If a patient is marked no-show but arrives 5 mins later, can the receptionist re-insert them without losing priority?
- **Internet Outage:** How does the clinic handle the queue if their local tablet loses connection? (Offline local cache required).
- **Overlapping Tokens:** Handling patients who join via phone vs. walk-ins to ensure no duplicate token numbers.
- **Service Time Variance:** A 5-minute checkup turning into a 45-minute procedure. System must auto-adjust "Est. Wait Time" for everyone behind.

---

## 7. KPIs
- **Average Wait Time Reduction:** Target < 15 mins of physical waiting.
- **Patient Satisfaction Score (CSAT):** Measured via post-consultation feedback.
- **No-Show Rate:** Monitoring if digital reminders reduce abandoned tokens.
- **System Usage:** Percentage of patients joining digitally vs. walk-in.

---

## 8. Risks
- **Privacy Concerns:** Patients might be hesitant to share phone numbers (mitigation: allow joining with just initials/alias).
- **Hardware Dependency:** Clinic requires stable internet and at least one tablet/PC.
- **SMS Costs:** High volume of notifications can eat into margins (mitigation: use WhatsApp or Push notifications where possible).
- **Doctor Fatigue:** Real-time visibility of a long queue might pressure doctors (mitigation: allow hiding the full list from the doctor's view).
