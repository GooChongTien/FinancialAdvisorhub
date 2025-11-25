import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import * as d3 from "d3";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { aggregateCashFlowForYear, formatCurrency } from "../utils/cashFlowUtils";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";

export default function SankeyFlowDiagram({ config, currentYear = 0, onYearChange }) {
    const svgRef = useRef(null);
    const [yearOffset, setYearOffset] = useState(currentYear || 0);
    const { prefs } = usePreferences?.() ?? { prefs: { currency: "SGD", language: "en" } };
    const fmt = useCallback((amount) => formatCurrency(amount, prefs), [prefs]);

    // Calculate cash flow for current year
    const prevYearBalance = yearOffset > 0
        ? aggregateCashFlowForYear(config.financialData, config, yearOffset - 1,
            yearOffset > 1 ? aggregateCashFlowForYear(config.financialData, config, yearOffset - 2, config.financialData.currentSavings).closingBalance
                : config.financialData.currentSavings
        ).closingBalance
        : config.financialData.currentSavings;

    const cashFlow = aggregateCashFlowForYear(config.financialData, config, yearOffset, prevYearBalance);

    // Sync with external year changes
    useEffect(() => {
        if (currentYear !== undefined && currentYear !== yearOffset) {
            setYearOffset(currentYear);
        }
    }, [currentYear]);

    // Render Sankey diagram
    useEffect(() => {
        if (!svgRef.current) return;

        const el = svgRef.current;
        const width = Math.max(600, el.clientWidth || 800);
        const height = 480;
        const margin = { top: 24, right: 140, bottom: 24, left: 140 };

        // Clear previous SVG
        d3.select(el).selectAll('*').remove();

        const svg = d3.select(el).append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // Column positions
        const nodeWidth = 64;
        const colLeftX = 0;
        const colCenterX = w / 2 - nodeWidth / 2;
        const colRightX = w - nodeWidth;

        // Calculate values
        const openingAbs = Math.abs(cashFlow.openingBalance);
        const closingAbs = Math.abs(cashFlow.closingBalance);
        const totalCash = Math.abs(cashFlow.totalCash);

        // Find max value for scaling
        const maxVal = Math.max(
            1,
            openingAbs,
            totalCash,
            closingAbs,
            cashFlow.activeIncome,
            cashFlow.investmentReturn,
            cashFlow.expenses,
            cashFlow.savings,
            cashFlow.investment
        );

        const scaleH = d3.scaleLinear()
            .domain([0, maxVal])
            .range([0, h * 0.72]);

        // LEFT COLUMN: Opening Balance + Inflows
        let yCursor = 16;
        const nodes = [];
        const links = [];

        // Opening Balance
        if (openingAbs > 0) {
            const node = {
                name: cashFlow.openingBalance >= 0 ? "Opening Balance" : "Opening Deficit",
                x: colLeftX,
                y: yCursor,
                width: nodeWidth,
                height: Math.max(18, scaleH(openingAbs)),
                value: openingAbs,
                color: cashFlow.openingBalance >= 0 ? "#f1c40f" : "#ff6b6b"
            };
            nodes.push(node);
            yCursor += node.height + 14;
        }

        // Active Income
        if (cashFlow.activeIncome > 0) {
            const node = {
                name: "Active Income",
                x: colLeftX,
                y: yCursor,
                width: nodeWidth,
                height: Math.max(18, scaleH(cashFlow.activeIncome)),
                value: cashFlow.activeIncome,
                color: "#10ac84"
            };
            nodes.push(node);
            yCursor += node.height + 14;
        }

        // Investment Return
        if (cashFlow.investmentReturn > 0) {
            const node = {
                name: "Investment Return",
                x: colLeftX,
                y: yCursor,
                width: nodeWidth,
                height: Math.max(18, scaleH(cashFlow.investmentReturn)),
                value: cashFlow.investmentReturn,
                color: "#10ac84"
            };
            nodes.push(node);
            yCursor += node.height + 14;
        }

        // CENTER: Total Cash
        const centerH = Math.max(20, scaleH(totalCash));
        const centerNode = {
            name: "Total Cash",
            x: colCenterX,
            y: h / 2 - centerH / 2,
            width: nodeWidth,
            height: centerH,
            value: totalCash,
            color: "#f1c40f"
        };
        nodes.push(centerNode);

        // RIGHT COLUMN: Balance + Outflows
        let rightY = 16;

        // Closing Balance
        const closingNode = {
            name: cashFlow.closingBalance >= 0 ? "Closing Balance" : "Deficit",
            x: colRightX,
            y: rightY,
            width: nodeWidth,
            height: Math.max(6, scaleH(closingAbs)),
            value: closingAbs,
            color: cashFlow.closingBalance >= 0 ? "#f1c40f" : "#ff6b6b"
        };
        nodes.push(closingNode);
        rightY += closingNode.height + 14;

        // Investment (teal)
        if (cashFlow.investment > 0) {
            const node = {
                name: "Investment",
                x: colRightX,
                y: rightY,
                width: nodeWidth,
                height: Math.max(18, scaleH(cashFlow.investment)),
                value: cashFlow.investment,
                color: "#14b8a6"
            };
            nodes.push(node);
            rightY += node.height + 14;
        }

        // Divider if we have both investment and other outflows
        if (cashFlow.investment > 0 && (cashFlow.expenses > 0 || cashFlow.savings > 0)) {
            g.append('text')
                .attr('x', colRightX + nodeWidth / 2)
                .attr('y', rightY + 4)
                .attr('text-anchor', 'middle')
                .attr('fill', '#9ca3af')
                .attr('font-size', 11)
                .attr('font-style', 'italic')
                .text('Other Outflows');
            rightY += 16;
        }

        // Expenses
        if (cashFlow.expenses > 0) {
            const node = {
                name: "Expenses",
                x: colRightX,
                y: rightY,
                width: nodeWidth,
                height: Math.max(18, scaleH(cashFlow.expenses)),
                value: cashFlow.expenses,
                color: "#ff6b6b"
            };
            nodes.push(node);
            rightY += node.height + 14;
        }

        // Savings
        if (cashFlow.savings > 0) {
            const node = {
                name: "Savings",
                x: colRightX,
                y: rightY,
                width: nodeWidth,
                height: Math.max(18, scaleH(cashFlow.savings)),
                value: cashFlow.savings,
                color: "#ff6b6b"
            };
            nodes.push(node);
            rightY += node.height + 14;
        }

        // Create links
        nodes.forEach(node => {
            if (node.x === colLeftX) {
                // Left -> Center
                links.push({
                    source: node,
                    target: centerNode,
                    value: node.value,
                    color: node.color
                });
            } else if (node.x === colRightX) {
                // Center -> Right
                links.push({
                    source: centerNode,
                    target: node,
                    value: node.value,
                    color: node.color
                });
            }
        });

        // Draw links
        links.forEach(lk => {
            const sx = lk.source.x + lk.source.width;
            const sy = lk.source.y + lk.source.height / 2;
            const tx = lk.target.x;
            const ty = lk.target.y + lk.target.height / 2;
            const cx = (sx + tx) / 2;
            const path = `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ty}, ${tx} ${ty}`;

            g.append('path')
                .attr('d', path)
                .attr('fill', 'none')
                .attr('stroke', lk.color)
                .attr('stroke-width', Math.max(2, scaleH(lk.value)))
                .attr('opacity', 0.4);
        });

        // Draw nodes
        function drawNode(node) {
            const grp = g.append('g');

            // Rectangle
            grp.append('rect')
                .attr('x', node.x)
                .attr('y', node.y)
                .attr('width', node.width)
                .attr('height', node.height)
                .attr('fill', node.color)
                .attr('rx', 6)
                .attr('opacity', 0.85);

            // Label (left or right of node)
            const isLeft = node.x < w / 2;
            grp.append('text')
                .attr('x', isLeft ? node.x - 10 : node.x + node.width + 10)
                .attr('y', node.y + node.height / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', isLeft ? 'end' : 'start')
                .attr('fill', '#e5e7eb')
                .attr('font-size', 12)
                .text(node.name);

            // Value inside node
            grp.append('text')
                .attr('x', node.x + node.width / 2)
                .attr('y', node.y + node.height / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'middle')
                .attr('fill', '#fff')
                .attr('font-weight', 700)
                .attr('font-size', 11)
                .text(fmt(node.value));
        }

        nodes.forEach(drawNode);

    }, [cashFlow, yearOffset, fmt]);

    const handlePrevYear = () => {
        const newYear = Math.max(0, yearOffset - 1);
        setYearOffset(newYear);
        if (onYearChange) onYearChange(newYear);
    };

    const handleNextYear = () => {
        const lifeExpectancy = 85;
        const maxYears = lifeExpectancy - config.financialData.currentAge;
        const newYear = Math.min(maxYears, yearOffset + 1);
        setYearOffset(newYear);
        if (onYearChange) onYearChange(newYear);
    };

    const displayYear = new Date().getFullYear() + yearOffset;
    const displayAge = config.financialData.currentAge + yearOffset;

    return (
        <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardContent className="p-6">
                {/* Header with Year Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        💰 Cash Flow Analysis
                    </h3>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Year {displayYear} (Age {displayAge})</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevYear}
                                disabled={yearOffset === 0}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextYear}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sankey Diagram */}
                <div
                    ref={svgRef}
                    className="w-full bg-gray-900/30 rounded-lg"
                    style={{ minHeight: '480px' }}
                />

                {/* Summary */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-lg p-3">
                        <div className="text-emerald-400 font-semibold">Total Inflows</div>
                        <div className="text-2xl font-bold text-emerald-300">{fmt(cashFlow.totalInflows)}</div>
                    </div>
                    <div className="bg-rose-600/20 border border-rose-500/30 rounded-lg p-3">
                        <div className="text-rose-400 font-semibold">Total Outflows</div>
                        <div className="text-2xl font-bold text-rose-300">{fmt(cashFlow.totalOutflows)}</div>
                    </div>
                    <div className={`${cashFlow.netCash >= 0 ? 'bg-amber-600/20 border-amber-500/30' : 'bg-red-600/20 border-red-500/30'} border rounded-lg p-3`}>
                        <div className={`${cashFlow.netCash >= 0 ? 'text-amber-400' : 'text-red-400'} font-semibold`}>Net Cash Flow</div>
                        <div className={`text-2xl font-bold ${cashFlow.netCash >= 0 ? 'text-amber-300' : 'text-red-300'}`}>
                            {cashFlow.netCash >= 0 ? '+' : '-'}{fmt(Math.abs(cashFlow.netCash))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
