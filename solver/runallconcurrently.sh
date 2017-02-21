#!/bin/bash

for PROBLEM in {0..20}
do
	(python solver.pyo $PROBLEM) &
done

