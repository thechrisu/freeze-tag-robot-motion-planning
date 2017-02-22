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

    static createSafePointIfNeeded(gridMatrix, point, radius, minimumOpenness) {
        let x = Math.round(point.x);
        let y = Math.round(point.y);
        if (gridMatrix[y][x] === 1) {
            let safePoint = null;
            while (safePoint === null) {
                let arraySize = radius * 8;
                let initialOpenness = SafePointHelper.initialiseArray(arraySize, 0);
                let points = new Array(arraySize);
                let minX = x - radius;
                let maxX = x + radius;
                let minY = y - radius;
                let maxY = y + radius;
                radius++;

                let openIndex = 0;
                let openCount = 0;
                let updateOpenness = (x, y) => {
                    points[openIndex] = new Point(x, y);
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

                if (openCount === 0) continue;

                let opennessIterations = arraySize;
                let opennessArrays = [initialOpenness.slice(0)];
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

                let maxOpenness = -Infinity;
                let index = null;

                for (let i = 0; i < arraySize; i++) {
                    let openness = 0;
                    for (let k = 0; k < opennessIterations; k++) {
                        openness += parseInt(opennessArrays[k][i], 10);
                    }
                    if (openness > maxOpenness) {
                        maxOpenness = openness;
                        index = i;
                    }
                }

                if (index !== null && maxOpenness > minimumOpenness) {
                    safePoint = points[index];
                }
            }
            return safePoint;
        }
        return null;
    };

}

module.exports = SafePointHelper;
