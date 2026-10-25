# Order Pipeline OS — Algorithm Visualizer

OS Mini-Project: CPU Scheduling, Producer–Consumer Synchronization, Banker's Algorithm, and Memory Management, applied to **Problem 2 — Online Shopping and Order Processing System**.

**Team:** Sparsh Chalotra (24003148) & Prajwal Martiwar (24003157)

## Run it

No build step, no dependencies. Just open `index.html` in a browser, or in VS Code:

1. Install the **Live Server** extension (optional but recommended).
2. Right-click `index.html` → **Open with Live Server**.

   — or —

   Just double-click `index.html` to open it directly in your browser.

## Project structure

```
order-pipeline-os/
├── index.html   # markup for all four modules (tabs)
├── style.css    # theme, layout, components (light/dark aware)
├── script.js    # all four simulation engines
└── README.md
```

## Modules (tabs in the app)

- **CPU Scheduling** — Round Robin over order-processing tasks, with Gantt chart and waiting/turnaround stats.
- **Producer–Consumer** — bounded order-queue buffer with mutex/empty/full semaphores and an event log.
- **Banker's Algorithm** — editable Allocation/Max/Available matrices, computed Need matrix, safe-sequence check.
- **Memory Management** — First Fit / Best Fit heap allocation with fragmentation stats.

Everything is editable live in the browser — add tasks, change the quantum, resize the buffer, edit the resource matrices, allocate/free memory — to generate your own worked examples.
