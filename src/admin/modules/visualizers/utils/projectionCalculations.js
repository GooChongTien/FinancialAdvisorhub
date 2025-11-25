/**
 * Projection Calculation Utilities
 * Handles wealth projection calculations for three scenarios:
 * 1. Planned - Life goals only, no bad events, no plans
 * 2. What-If - Life goals + bad events, no plans
 * 3. Recommended - Life goals + savings plans + insurance coverage
 */

/**
 * Calculate "Planned" wealth projection
 * Includes: Life goals as expenses
 * Excludes: Bad events, savings plans, insurance coverage
 */
export const calculatePlannedProjection = (financialData, events) => {
    const projection = [];
    let netWorth = financialData.currentSavings;
    const currentAge = financialData.currentAge;
    const lifeExpectancy = 85;
    const yearsToProject = lifeExpectancy - currentAge;

    for (let year = 0; year <= yearsToProject; year++) {
        const age = currentAge + year;

        // Base calculations
        let annualIncome = financialData.annualIncome * Math.pow(1 + financialData.incomeGrowthRate / 100, year);
        let annualExpenses = financialData.monthlyExpenses * 12 * Math.pow(1 + (financialData.inflationRate || 3) / 100, year);
        let annualSavings = financialData.monthlySavings * 12;

        // Investment return - use conservative rate after retirement (2% vs 5%)
        let investmentReturnRate = financialData.investmentReturnRate / 100;

        // Check if retired
        if (age >= financialData.retirementAge) {
            annualIncome = 0;
            annualSavings = 0;
            // After retirement, use conservative 2% return rate for safer investments
            investmentReturnRate = 0.02;
        }

        let investmentReturn = netWorth * investmentReturnRate;

        // Apply life goals as expenses
        const lifeGoalThisYear = events.lifeGoals?.find(g => g.goalYear === year);
        if (lifeGoalThisYear) {
            annualExpenses += (lifeGoalThisYear.goalAmount || 0);
        }

        // Calculate cash flow and net worth
        const cashFlow = annualIncome - annualExpenses + investmentReturn + annualSavings;
        netWorth += cashFlow;

        projection.push({
            year,
            age,
            netWorth: Math.max(0, netWorth),
            cashFlow,
            annualIncome,
            annualExpenses,
            investmentReturn,
            hasEvent: false,
            eventType: null
        });
    }

    return projection;
};

/**
 * Calculate "What-If" wealth projection
 * Includes: Life goals before bad event, bad event impact
 * Excludes: Savings plans, insurance coverage
 */
export const calculateWhatIfProjection = (financialData, events) => {
    const projection = [];
    let netWorth = financialData.currentSavings;
    const currentAge = financialData.currentAge;
    const lifeExpectancy = 85;
    const yearsToProject = lifeExpectancy - currentAge;

    // Track bad event
    let triggeredBadEvent = events.badEvents?.[0];
    let yearsAfterEvent = 0;

    for (let year = 0; year <= yearsToProject; year++) {
        const age = currentAge + year;

        // Base calculations
        let annualIncome = financialData.annualIncome * Math.pow(1 + financialData.incomeGrowthRate / 100, year);
        let annualExpenses = financialData.monthlyExpenses * 12 * Math.pow(1.02, year);
        let annualSavings = financialData.monthlySavings * 12;

        // Investment return - use conservative rate after retirement (2% vs 5%)
        let investmentReturnRate = financialData.investmentReturnRate / 100;

        // Check if retired
        if (age >= financialData.retirementAge) {
            annualIncome = 0;
            annualSavings = 0;
            // After retirement, use conservative 2% return rate for safer investments
            investmentReturnRate = 0.02;
        }

        let investmentReturn = netWorth * investmentReturnRate;

        // Apply life goals that occur BEFORE bad event
        const badEventYear = triggeredBadEvent?.triggerYear || Infinity;
        const lifeGoalThisYear = events.lifeGoals?.find(g => g.goalYear === year && g.goalYear < badEventYear);
        if (lifeGoalThisYear) {
            annualExpenses += (lifeGoalThisYear.goalAmount || 0);
        }

        // Check for bad event in this year
        let hasEvent = false;
        let eventType = null;

        if (triggeredBadEvent && triggeredBadEvent.triggerYear === year) {
            yearsAfterEvent = 0;
            hasEvent = true;
            eventType = triggeredBadEvent.label;

            // Apply initial impact (NO COVERAGE)
            switch (triggeredBadEvent.id) {
                case 'death':
                    annualIncome = 0;
                    annualExpenses += 50000;
                    break;
                case 'critical_illness':
                    annualExpenses += 100000;
                    break;
                case 'tpd':
                    annualExpenses += 50000;
                    break;
                case 'accident':
                    annualExpenses += 30000;
                    break;
                case 'inflation_shock':
                    annualExpenses *= 1.5;
                    break;
            }
        }

        // Apply ongoing effects
        if (triggeredBadEvent && year > triggeredBadEvent.triggerYear) {
            yearsAfterEvent++;

            switch (triggeredBadEvent.id) {
                case 'death':
                    annualIncome = 0;
                    break;
                case 'critical_illness':
                    if (yearsAfterEvent <= 3) {
                        annualIncome *= 0.5;
                        annualExpenses += 20000;
                    }
                    break;
                case 'tpd':
                    annualIncome = 0;
                    annualExpenses += 30000;
                    break;
                case 'inflation_shock':
                    annualExpenses *= Math.pow(1.05, Math.min(yearsAfterEvent, 5));
                    break;
            }
        }

        // Calculate cash flow and net worth
        const cashFlow = annualIncome - annualExpenses + investmentReturn + annualSavings;
        netWorth += cashFlow;

        projection.push({
            year,
            age,
            netWorth: Math.max(0, netWorth),
            cashFlow,
            annualIncome,
            annualExpenses,
            investmentReturn,
            hasEvent,
            eventType
        });
    }

    return projection;
};

/**
 * Calculate "Recommended" wealth projection (formerly "To Be")
 * Includes: Life goals, savings plans, insurance coverage
 */
export const calculateRecommendedProjection = (financialData, coverage, events) => {
    const projection = [];
    let netWorth = financialData.currentSavings;
    const currentAge = financialData.currentAge;
    const lifeExpectancy = 85;
    const yearsToProject = lifeExpectancy - currentAge;

    // Track bad event
    let triggeredBadEvent = events.badEvents?.[0];
    let yearsAfterEvent = 0;

    for (let year = 0; year <= yearsToProject; year++) {
        const age = currentAge + year;

        // Base calculations
        let annualIncome = financialData.annualIncome * Math.pow(1 + financialData.incomeGrowthRate / 100, year);
        let annualExpenses = financialData.monthlyExpenses * 12 * Math.pow(1.02, year);
        let annualSavings = financialData.monthlySavings * 12;

        // Investment return - use conservative rate after retirement (2% vs 5%)
        let investmentReturnRate = financialData.investmentReturnRate / 100;

        // Check if retired
        if (age >= financialData.retirementAge) {
            annualIncome = 0;
            annualSavings = 0;
            // After retirement, use conservative 2% return rate for safer investments
            investmentReturnRate = 0.02;
        }

        let investmentReturn = netWorth * investmentReturnRate;

        // Apply life goals
        const lifeGoalThisYear = events.lifeGoals?.find(g => g.goalYear === year);
        if (lifeGoalThisYear) {
            const goalAmount = lifeGoalThisYear.goalAmount || 0;
            annualExpenses += goalAmount;
            // Savings plan covers the expense
            netWorth += goalAmount;
        }

        // Apply savings/endowment plan
        if (coverage.savingsPlan && coverage.savingsPlan.type) {
            const { type, premiumYears, annualPremium, maturityYear, payoutYears, annualPayout, maturityPayout } = coverage.savingsPlan;

            // Deduct premiums during payment period
            if (year > 0 && year <= premiumYears) {
                annualExpenses += annualPremium;
            }

            // Handle payouts based on plan type
            if (type === 'lumpsum') {
                if (year === maturityYear) {
                    netWorth += maturityPayout;
                }
            } else if (type === 'regular_payout') {
                if (year >= maturityYear && year < maturityYear + payoutYears) {
                    netWorth += annualPayout;
                }
            } else if (type === 'annuity') {
                if (year >= maturityYear) {
                    netWorth += annualPayout;
                }
            }
        }

        // Check for bad event
        let hasEvent = false;
        let eventType = null;

        if (triggeredBadEvent && triggeredBadEvent.triggerYear === year) {
            yearsAfterEvent = 0;
            hasEvent = true;
            eventType = triggeredBadEvent.label;

            // Apply coverage (insurance pays out)
            switch (triggeredBadEvent.id) {
                case 'death':
                    netWorth += coverage.death;
                    annualIncome = 0;
                    annualExpenses += 50000;
                    break;
                case 'critical_illness':
                    netWorth += coverage.ci;
                    annualExpenses += 100000;
                    break;
                case 'tpd':
                    netWorth += coverage.tpd;
                    annualExpenses += 50000;
                    break;
                case 'accident':
                    netWorth += coverage.accident;
                    annualExpenses += 30000;
                    break;
                case 'inflation_shock':
                    annualExpenses *= 1.5;
                    break;
            }
        }

        // Apply ongoing effects
        if (triggeredBadEvent && year > triggeredBadEvent.triggerYear) {
            yearsAfterEvent++;

            switch (triggeredBadEvent.id) {
                case 'death':
                    annualIncome = 0;
                    break;
                case 'critical_illness':
                    if (yearsAfterEvent <= 3) {
                        annualIncome *= 0.5;
                        annualExpenses += 20000;
                    }
                    break;
                case 'tpd':
                    annualIncome = 0;
                    annualExpenses += 30000;
                    break;
                case 'inflation_shock':
                    annualExpenses *= Math.pow(1.05, Math.min(yearsAfterEvent, 5));
                    break;
            }
        }

        // Calculate cash flow and net worth
        const cashFlow = annualIncome - annualExpenses + investmentReturn + annualSavings;
        netWorth += cashFlow;

        projection.push({
            year,
            age,
            netWorth: Math.max(0, netWorth),
            cashFlow,
            annualIncome,
            annualExpenses,
            investmentReturn,
            hasEvent,
            eventType
        });
    }

    return projection;
};

// Keep old function names for backward compatibility during migration
export const calculateAsIsProjection = calculatePlannedProjection;
export const calculateToBeProjection = calculateRecommendedProjection;

/**
 * Generate insights comparing projections
 */
export const generateInsights = (plannedProjection, recommendedProjection, events, coverage) => {
    const insights = [];
    const finalPlanned = plannedProjection[plannedProjection.length - 1];
    const finalRecommended = recommendedProjection[recommendedProjection.length - 1];

    const wealthGap = finalRecommended.netWorth - finalPlanned.netWorth;

    if (wealthGap > 0) {
        insights.push({
            type: 'success',
            title: 'Positive Wealth Impact',
            description: `With recommended solutions, your projected wealth at age 85 is $${wealthGap.toLocaleString()} higher.`
        });
    }

    if (events.badEvents && events.badEvents.length > 0) {
        const event = events.badEvents[0];
        insights.push({
            type: 'warning',
            title: `${event.label} Risk Identified`,
            description: `A ${event.label.toLowerCase()} event at year ${event.triggerYear} could significantly impact your wealth. Recommended coverage: $${coverage[event.id === 'critical_illness' ? 'ci' : event.id]?.toLocaleString() || '0'}.`
        });
    }

    if (events.lifeGoals && events.lifeGoals.length > 0) {
        insights.push({
            type: 'info',
            title: 'Life Goals Planning',
            description: `You have ${events.lifeGoals.length} life goal(s) planned. Savings plans are recommended to ensure these goals are met.`
        });
    }

    return insights;
};

/**
 * Generate yearly insights for current year
 */
export const generateYearlyInsights = (currentYear, plannedData, recommendedData, events, coverage, financialData) => {
    const insights = [];
    const age = financialData.currentAge + currentYear;

    // Check for life goal this year
    const lifeGoalThisYear = events.lifeGoals?.find(g => g.goalYear === currentYear);
    if (lifeGoalThisYear) {
        insights.push({
            type: 'info',
            title: `Life Goal: ${lifeGoalThisYear.label}`,
            description: `This year marks your ${lifeGoalThisYear.label.toLowerCase()} goal with a target amount of $${lifeGoalThisYear.goalAmount?.toLocaleString() || '0'}.`
        });
    }

    // Check for bad event this year
    const badEventThisYear = events.badEvents?.find(e => e.triggerYear === currentYear);
    if (badEventThisYear) {
        insights.push({
            type: 'warning',
            title: `Risk Event: ${badEventThisYear.label}`,
            description: `A ${badEventThisYear.label.toLowerCase()} occurs this year. With coverage, you receive $${coverage[badEventThisYear.id === 'critical_illness' ? 'ci' : badEventThisYear.id]?.toLocaleString() || '0'} payout.`
        });
    }

    // Wealth comparison
    const wealthGap = recommendedData.netWorth - plannedData.netWorth;
    if (Math.abs(wealthGap) > 10000) {
        if (wealthGap > 0) {
            insights.push({
                type: 'success',
                title: 'Wealth Building',
                description: `At age ${age}, your recommended plan gives you $${wealthGap.toLocaleString()} more wealth than the planned scenario.`
            });
        } else {
            insights.push({
                type: 'info',
                title: 'Investment Period',
                description: `At age ${age}, you're in the premium payment phase. Your wealth will grow significantly after maturity.`
            });
        }
    }

    return insights;
};
