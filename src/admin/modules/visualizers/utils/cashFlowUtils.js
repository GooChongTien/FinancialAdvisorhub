/**
 * Cash Flow Utilities
 * Helper functions for aggregating and calculating cash flows for Sankey diagram
 */

/**
 * Aggregate cash flow data for a specific year
 * Based on the reference implementation from Sankey Cash Flow Visualizer
 */
export const aggregateCashFlowForYear = (financialData, config, year, prevYearBalance = 0) => {
    const age = financialData.currentAge + year;
    const isRetired = age >= financialData.retirementAge;

    // Calculate inflows
    let activeIncome = 0;
    if (!isRetired) {
        activeIncome = financialData.annualIncome * Math.pow(1 + financialData.incomeGrowthRate / 100, year);
    }

    const investmentReturn = prevYearBalance * (financialData.investmentReturnRate / 100);
    const passiveIncome = 0; // Could be added later for dividends, rental income, etc.

    const totalInflows = activeIncome + investmentReturn + passiveIncome;

    // Calculate outflows
    const expenses = financialData.monthlyExpenses * 12 * Math.pow(1.02, year);

    // Savings only if not retired
    const savings = !isRetired ? financialData.monthlySavings * 12 : 0;

    // Investment (treated separately for visualization)
    let investment = 0;
    if (config.savingsPlan && config.savingsPlan.type) {
        const { premiumYears, annualPremium } = config.savingsPlan;
        if (year > 0 && year <= premiumYears) {
            investment = annualPremium;
        }
    }

    const taxes = 0; // Could be calculated based on income tax brackets

    const totalOutflows = expenses + savings + investment + taxes;

    // Calculate net cash flow and balance
    const netCash = totalInflows - totalOutflows;
    const closingBalance = prevYearBalance + netCash;

    return {
        year,
        age,
        openingBalance: prevYearBalance,

        // Inflows breakdown
        activeIncome,
        investmentReturn,
        passiveIncome,
        totalInflows,

        // Outflows breakdown
        expenses,
        savings,
        investment,
        taxes,
        totalOutflows,

        // Summary
        netCash,
        closingBalance,

        // Total cash in system (for Sankey center node)
        totalCash: prevYearBalance + totalInflows
    };
};

/**
 * Get cash flow data across multiple years
 */
export const getCashFlowSeries = (financialData, config, startYear = 0, endYear = 30) => {
    const series = [];
    let runningBalance = financialData.currentSavings;

    for (let year = startYear; year <= endYear; year++) {
        const yearData = aggregateCashFlowForYear(financialData, config, year, runningBalance);
        series.push(yearData);
        runningBalance = yearData.closingBalance;
    }

    return series;
};

import { formatCurrency as formatCurrencyShared } from "@/lib/utils";

/**
 * Format currency for display with optional preferences
 */
export const formatCurrency = (amount, prefs = { currency: "SGD", language: "en" }) => {
    return formatCurrencyShared(Math.round(amount || 0), {
        currency: prefs?.currency || "SGD",
        language: prefs?.language || "en",
    });
};
