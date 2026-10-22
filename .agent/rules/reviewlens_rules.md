# REVIEWLENS PROJECT RULES
1. Follow docs/BLUEPRINT.md. Do not add features outside the current phase.
2. NEVER invent, estimate or hard-code metrics. All numbers come from scripts that write reports/*.csv.
3. Fit TF-IDF and any learned preprocessing on the training split only. Tune with cross-validation on train, never on test.
4. Use seed 42. Put seed, sample size, paths, model ids and max length in src/config.py.
5. Keep modules separate: training, inference, evaluation and UI. app.py must not train anything.
6. Both models are evaluated on the identical sample defined in src/config.py.
7. Commands target Windows PowerShell with a .venv virtual environment.
8. Before any run expected to take more than a few minutes, show the estimate and wait for approval.
9. After installing, record the exact tested versions in requirements.txt.
10. Do not commit datasets, .venv, caches or files larger than the limit in Section 15.
11. At the end of each phase, output: what changed, how to verify it, and any assumption made.
