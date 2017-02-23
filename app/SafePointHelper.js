/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

const Point = require('./CoordinateHelper').Point;

class SafePointHelper {

    static initialiseArray(length, value) {
        let array = new Array(length);
        for (let i = 0; i < length; i++) {
            array[i] = value;
        }
        return array;
    };

    static createSafePointIfNeeded(gridMatrix, gridMatrixNoStroke, point, radius, minimumOpenness) {
        let x = Math.round(point.x);
        let y = Math.round(point.y);
        if(gridMatrix == null) return null;
        if(gridMatrix[y]== null) return null;
        if (gridMatrix[y][x] === 1) {
            let safePoint = null;
            let previousLayer = null;
            let previousLayerMax = 0;
            let previousLayerNoStroke = null;
            let previousLayerMaxNoStroke = 0;
            while (safePoint === null) {

                let arraySize = radius * 8;
                let points = new Array(arraySize);

                let initialOpenness = SafePointHelper.initialiseArray(arraySize, 0);
                SafePointHelper.calculateOpenness(x, y, radius, gridMatrix, initialOpenness, points);
                let initialOpennessNoStroke = SafePointHelper.initialiseArray(arraySize, 0);
                SafePointHelper.calculateOpenness(x, y, radius, gridMatrixNoStroke, initialOpennessNoStroke, points);

                radius++;
                //if (openCount === 0) continue;

                let opennessArrays = [initialOpenness.slice(0)];
                SafePointHelper.prepareOpennessArrays(arraySize, opennessArrays);
                let opennessArraysNoStroke = [initialOpennessNoStroke.slice(0)];
                SafePointHelper.prepareOpennessArrays(arraySize, opennessArraysNoStroke);

                let prevLayerWeight = SafePointHelper.initialiseArray(arraySize, 0);
                SafePointHelper.calculatePreviousLayerWeights(arraySize, previousLayer, previousLayerMax, prevLayerWeight);
                let prevLayerWeightNoStroke = SafePointHelper.initialiseArray(arraySize, 0);
                SafePointHelper.calculatePreviousLayerWeights(arraySize, prevLayerWeightNoStroke, previousLayerMaxNoStroke, prevLayerWeight);

                let totalOpenness = [];
                let maxOpenness = SafePointHelper.calculateTotalOpenness(arraySize, opennessArrays, prevLayerWeight, totalOpenness);
                let totalOpennessNoStroke = [];
                let maxOpennessNoStroke = SafePointHelper.calculateTotalOpenness(arraySize, opennessArraysNoStroke, prevLayerWeightNoStroke, totalOpennessNoStroke);

                let index = null;
                let max = -Infinity;
                for (let i = 0; i < arraySize; i++) {
                    let result = totalOpenness[i] * (1 + totalOpennessNoStroke[i]) * 0.5;
                    if(result > max) {
                        max = result;
                        index = i;
                    }
                }

                if (index !== null && max > minimumOpenness) {
                    safePoint = points[index];
                }
                previousLayer = totalOpenness;
                previousLayerMax = maxOpenness;
                previousLayerNoStroke = totalOpennessNoStroke;
                previousLayerMaxNoStroke = maxOpennessNoStroke;
            }
            return safePoint;
        }
        return null;
    };

    static calculateTotalOpenness(arraySize, opennessArrays, prevLayerWeight, totalOpenness) {
        let maxOpenness = -Infinity;
        for (let i = 0; i < arraySize; i++) {
            let openness = 0;
            for (let k = 0; k < arraySize; k++) {
                openness += parseInt(opennessArrays[k][i], 10);
            }
            openness *= (0.25 + 0.75 * prevLayerWeight[i]);
            totalOpenness.push(openness);
            if (openness > maxOpenness) {
                maxOpenness = openness;
            }
        }
        return maxOpenness;
    }

    static calculatePreviousLayerWeights(arraySize, previousLayer, previousLayerMax, prevLayerWeight) {
        if (previousLayer !== null && previousLayerMax > 0) {
            let prevLayerSize = previousLayer.length;
            let ratio = prevLayerSize / arraySize;
            for (let i = 0; i < arraySize; i++) {
                let k = Math.round(i * ratio) % prevLayerSize;
                prevLayerWeight[i] = previousLayer[k] / previousLayerMax;
            }
        }
    }

    static prepareOpennessArrays(arraySize, opennessArrays) {
        let opennessIterations = arraySize;
        let arrayIndex = 0;
        while (arrayIndex < opennessIterations) {
            let shrinkedOpenness = SafePointHelper.initialiseArray(arraySize, 1);
            for (let i = 0; i < arraySize; i++) {
                if (opennessArrays[arrayIndex][i] === 0) {
                    shrinkedOpenness[(((i - 1) % arraySize) + arraySize) % arraySize] = 0;
                    shrinkedOpenness[i] = 0;
                    shrinkedOpenness[(i + 1) % arraySize] = 0;
                }
            }
            opennessArrays.push(shrinkedOpenness);
            arrayIndex++;
        }
    }

    static calculateOpenness(x, y, radius, gridMatrix, initialOpenness, points) {
        let minX = x - radius;
        let maxX = x + radius;
        let minY = y - radius;
        let maxY = y + radius;

        let openIndex = 0;
        let openCount = 0;
        let updateOpenness = (x, y) => {
            points[openIndex] = new Point(x, y);
            if (!gridMatrix[y]) {
                throw new Error('Could not find a safe point!');
            }
            if (gridMatrix[y][x] === 0) {
                initialOpenness[openIndex] = 1;
                openCount++;
            } else {
                initialOpenness[openIndex] = 0;
            }
            openIndex++;
        };
        for (let sx = minX; sx <= maxX; sx++) {
            updateOpenness(sx, minY);
        }
        for (let sy = minY + 1; sy <= maxY; sy++) {
            updateOpenness(maxX, sy);
        }
        for (let sx = maxX - 1; sx >= minY; sx--) {
            updateOpenness(sx, maxY);
        }
        for (let sy = maxY - 1; sy > minY; sy--) {
            updateOpenness(minX, sy);
        }
        return openCount;
    }

}

module.exports = SafePointHelper;
