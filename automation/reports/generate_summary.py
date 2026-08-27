#!/usr/bin/env python3
"""Wrapper: generate_summary.py"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from generate_master_report import generate_summary_md
import argparse
from datetime import datetime

parser = argparse.ArgumentParser()
parser.add_argument("--suite", default="all"); parser.add_argument("--run-number", default="1")
parser.add_argument("--output-dir", default="automation/reports/output")
args = parser.parse_args()
ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
out = os.path.join(args.output_dir, args.suite) if args.suite != "all" else args.output_dir
generate_summary_md(args.run_number, ts, out)
