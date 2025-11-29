# 🐰 Labubu’s Sky Hop

**Labubu’s Sky Hop** is a browser-based 3D platformer ("Obby") built with **Three.js**. The player controls a procedural 3D avatar, navigating through increasingly difficult floating courses to reach the Golden Platform. The game features custom-tuned arcade physics, a smart "Ghost" training system, and procedural audio.

## 🎮 Game Overview

The goal is simple: Jump from platform to platform without falling into the void. You have **5 lives** to complete the course.

### Controls
* **W / A / S / D**: Move Character
* **SPACE**: Jump
* **MOUSE**: Rotate Camera
* **P**: Photo Mode (Pauses game & hides UI for screenshots)
* **ESC**: Pause / Menu

---

## ✨ Key Features

* **Custom 3D Engine**: Built purely in TypeScript using Three.js (no external game engine).
* **"No-Slip" Arcade Physics**: Custom velocity dampening ensures precise platforming control without the "sliding on ice" feel common in web games.
* **Ghost Training Mode**: A holographic AI guide runs the course in front of you, displaying dynamic key prompts (e.g., "W + SPACE") based on the terrain ahead.
* **Procedural Animation**: The avatar's walking cycle (arms/legs) is generated mathematically using sine waves, rather than pre-baked animation files.
* **Dynamic Hint System**: If the player falls, the game analyzes their position to provide specific advice (e.g., "Use 'A' + Space to jump Left").
* **Photo Mode**: A dedicated mode to freeze the action and release the cursor for capturing screenshots.

---

## 📸 Screenshots

### 1. The Starting Line
*Navigate through a vibrant 3D world with trees, clouds, and checkerboard platforms.*
![Start Screen](labubu-hop-screen1.png)

### 2. High Altitude Platforming
*Precise jumping mechanics allow for traversing wide gaps and vertical climbs.*
![High Altitude](labubu-hop-screen2.png)

### 3. Ghost Training Mode
*Enable "Training Mode" to see a holographic guide that shows you exactly where to move and jump.*
![Ghost Mode](labubu-hop-screen3.png)

### 4. Smart Tips
*The game detects why you failed and offers context-aware tips to help you improve.*
![Game Tips](labubu-hop-screen4.png)

---

## 🧠 Main Algorithms

### 1. The Ghost AI (Waypoint Navigation)
The training ghost does not use a neural network; it uses a **Vector-based State Machine**:
1.  **Pathfinding:** A predefined array of `Vector3` coordinates tracks the "perfect path" through the level.
2.  **Steering:** The ghost calculates a direction vector by subtracting its current position from the target waypoint: $D = T - P$.
3.  **Key Inference:** The system analyzes the vector to the next waypoint to generate UI labels:
    * If $\Delta Y > 1.0$, it prompts **SPACE**.
    * If $\Delta X < -2$, it prompts **A**.
    * If $\Delta X > 2$, it prompts **D**.

### 2. "No-Slip" Physics
To solve the common issue of web-based 3D characters sliding off blocks, the game implements a dual-friction model:
* **Ground Detection:** A `Raycaster` fires downwards from the player's center.
* **Friction Logic:**
    * **On Ground:** Friction is set extremely high (`20.0`), immediately dampening velocity when keys are released.
    * **In Air:** Friction is reduced significantly, allowing momentum to carry the player over gaps.

### 3. Procedural Audio
Instead of loading large MP3 files, the game generates music in real-time using the **Web Audio API**:
* An `OscillatorNode` generates square waves (giving a retro/Roblox chiptune sound).
* A `GainNode` creates an exponential ramp to fade notes out, simulating a plucked instrument.
* A sequencer array loops through specific frequencies to play the background melody.

---

## 🚀 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/labubu-sky-hop.git](https://github.com/YOUR_USERNAME/labubu-sky-hop.git)
    cd labubu-sky-hop
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open your browser to the local host URL provided (usually `http://localhost:5173`).

---

## 🛠️ Tech Stack

* **Language:** TypeScript
* **3D Library:** Three.js
* **Build Tool:** Vite
* **Controls:** PointerLockControls (Three.js addon)
