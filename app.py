from flask import Flask, render_template, request, jsonify
import re
from itertools import product

app = Flask(__name__, static_folder="static", template_folder="templates")

def generate_staad(payload):
    try:
        start_load = int(payload.get("start_load", 1))
    except Exception:
        start_load = 1
    try:
        start_comb = int(payload.get("start_comb", 101))
    except Exception:
        start_comb = 101

    names = payload.get("names", [])            # list of 11 names
    types = payload.get("types", [])            # list of 11 types
    subcases = payload.get("subcases", [])      # list of 11 subcase counts (strings)
    coeffs = payload.get("coeffs", [])          # list of rows (each row list of 11 strings)

    # Build load cases and groups
    load_cases = []
    load_case_groups = {}
    current_load = start_load

    for col in range(len(names)):
        base_name = (names[col] or "").strip()
        ltype = (types[col] or "").strip()
        try:
            sc = int(subcases[col]) if subcases[col] != "" else 1
        except Exception:
            sc = 1

        if base_name and ltype:
            group = []
            for i in range(1, sc + 1):
                case_name = f"{base_name}{i}"
                display_title = case_name if sc > 1 else re.sub(r"\d+$", "", case_name)
                load_cases.append(f"LOAD {current_load} LOADTYPE {ltype} TITLE {display_title}")
                group.append((col, current_load, case_name))
                current_load += 1
            load_case_groups[col] = group

    # Build combinations
    combinations = []
    current_comb = start_comb

    for row in coeffs:
        # ensure row length equals number of cases (11)
        coeffs_row = []
        for i in range(len(names)):
            try:
                coeffs_row.append(float(row[i]) if i < len(row) and row[i] != "" else 0.0)
            except Exception:
                coeffs_row.append(0.0)

        active_cols = [i for i, c in enumerate(coeffs_row) if c != 0]
        if not active_cols:
            continue

        subcase_options = []
        for col in active_cols:
            if col in load_case_groups:
                subcase_options.append(load_case_groups[col])
            else:
                base_name = names[col] if col < len(names) else f"load{col+1}"
                subcase_options.append([(col, 0, f"{base_name}1")])

        for permutation in product(*subcase_options):
            expr_parts = []
            factor_parts = []
            coeffs_for_active = [coeffs_row[c] for c in active_cols]
            for item, coeff in zip(permutation, coeffs_for_active):
                col_idx, load_num, case_name = item
                sign = "+" if coeff >= 0 else "-"
                abs_coeff = abs(coeff)
                if col_idx in load_case_groups and len(load_case_groups[col_idx]) > 1:
                    display_name = case_name
                else:
                    display_name = re.sub(r"\d+$", "", case_name)
                expr_parts.append(f"{sign} {abs_coeff} {display_name}")
                factor_parts.append(f"{load_num} {coeff}")

            if expr_parts:
                comb_def = f"LOAD COMB {current_comb} COMB -{' '.join(expr_parts)}".replace(" -+", " -")
                factors_line = " ".join(factor_parts)
                combinations.append(comb_def)
                combinations.append(factors_line)
                current_comb += 1

    total_loads = len(load_cases)
    total_combs = len(combinations) // 2

    output_lines = ["**** Load Case ****", ""] + load_cases + ["", "*** Load Combinations ***", ""] + combinations
    return {
        "output": "\n".join(output_lines),
        "total_loads": total_loads,
        "total_combs": total_combs
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate():
    payload = request.json or {}
    result = generate_staad(payload)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
