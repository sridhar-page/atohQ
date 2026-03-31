# AtohQ: Tab-by-Tab Feature Guide

AtohQ is a premium Queue Management System (QMS) designed to eliminate physical waiting lines and streamline the patient journey. Below is a comprehensive breakdown of the features available in each tab of the application, in the order they appear in the navigation dashboard.

---

## 1. Self-Service Portal (Check-in)
*The front door of your facility. A fast, digital-first experience that eliminates physical lines at the registration desk.*

*   **Instant Patient Registration**: Patients join the queue by entering their name and phone number. This 30-second process creates a digital identity in our system.
*   **Intelligent Department Routing**: Patients select the specific service they need (e.g., General Medicine or Dental Clinic). AtohQ automatically routes them to the correct queue.
*   **Real-Time Queue Visibility**: The selection dropdown displays the current wait count (e.g., "General Medicine(0 token waiting)"), providing transparency before check-in.
*   **Virtual Token Generation**: The system instantly generates a unique Token ID (e.g., **G-106**). This is the patient's "digital place" in line.

## 2. Current Status Hub (Transparency)
*The bridge between patients and providers. A dedicated portal that keeps everyone informed and calm.*

*   **Live Position Intelligence**: Patients don't have to guess. The hub provides specific context like **"1 token ahead of you"** or **"2 tokens ahead of you"**, keeping patients perfectly informed.
*   **Interactive Status Tracking**: Detailed "Status Intelligence" displays which service desk and room (e.g., **Room 402**) is currently handling the case.
*   **Average Wait Insights**: Patients can see the **Avg Wait Time** (e.g., 10 mins) for their specific department directly in their status view.
*   **Token Cancellation**: Patients have the power to **Cancel** their own token if they can no longer attend, automatically refreshing the queue for others.
*   **High-Contrast Token Display**: Uses full alphanumeric identifiers (e.g., **G-101**) for maximum clarity across all patient-facing views.

## 3. Reception Dashboard (Operational Control)
*The command center for staff. A high-clarity interface for managing the flow of the entire facility.*

*   **Atomic "Complete & Next" Workflow**: Unmarks the current consultation as finished and automatically calls the next patient with one click.
*   **Status Synchronization**: Displays a live "PAUSED" or "ACTIVE" status that is synchronized in real-time with specialists in the back office.
*   **Direct & Emergency Registration**: Receptionists can manually register walk-ins and trigger **Emergency Protocols (E-prefix)** to bypass the standard sequence for critical cases.
*   **Efficiency Benchmarking**: Tracks live No-Show rates and urgent case counts to help staff optimize daily operations.

## 4. Specialist Hub (Departmental Focus)
*A precision lens for clinicians. This view allows specialists to manage their own consultations and availability.*

*   **Dedicated "Now Consulting" Card**: Specialists see exactly who they are currently treating, including patient name, token number, and their assigned room.
*   **Direct Call Actions**: Specialists can call the next patient or complete sessions independently, ensuring the queue moves even without receptionist intervention.
*   **Availability Toggle (Pause/Resume)**: Specialists can toggle their status to "PAUSED" during breaks. This instantly notifies the receptionist, preventing them from sending new patients until the specialist is "AVAILABLE" again.
*   **Flow Density Metrics**: Provides a specialist-specific view of wait times and queue density for their specific department.

## 5. Interactive Public Display
*A simplified table designed for high-visibility waiting area TV monitors.*

*   **Central Patient Table**: features three critical columns: **Token Number**, **Room Number**, and **Speciality**.
*   **Dynamic Room Guidance**: Automatically guides patients with clear instructions (e.g., **Proceed to Room 402**).
*   **Announcement Ticker**: A scrolling footer for hospital instructions, safety protocols, and pharmacy updates.
*   **Real-time Sync**: The display refreshes instantly via Socket.io the moment any specialist or receptionist calls a new token.

## 6. System Admin Dashboard (Operational Intel)
*The decision-maker's lens. A professional analytics suite for facility management.*

*   **Facility-Wide Metrics**: Get an instant pulse on the facility with metrics like "Visited Today", "Served Today", and live "In Queue" counts.
*   **Canceled Token Analytics**: Tracks real-time **Token Cancellations** for the day, providing insights into patient abandonment rates.
*   **Daily Traffic Visualization**: A professional Area Chart maps out patient arrival trends over a 24-hour cycle to help optimize staffing.
*   **Room Assignment Management**: Admins have the global authority to assign and update room numbers for every department in the clinic.
*   **Daily Token Quotas**: Managers can enforce a "Maximum Tokens Per Day" cap for each clinic, preventing overbooking and ensuring manageable patient volumes.
*   **Operating Hours Control**: Define specific **Start** and **End** times for each department. Registrations are automatically blocked outside these hours, providing automated control over the facility's schedule.

---
**AtohQ** — *Modernizing the way the world waits.*

![Public Display Table](file:///home/vlacks/.gemini/antigravity/brain/6a91687a-39ce-4f86-a697-2090ecb75d6b/public_display_verification_final_1774950640632.png)
