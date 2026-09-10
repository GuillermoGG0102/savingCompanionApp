import {
  calculateDeviation,
  calculateNetWorth,
  calculateNetWorthDelta,
  calculateSavings,
  calculateSavingsRate,
} from './calculations';

describe('calculateSavings', () => {
  it('resta gastos fijos y variables de los ingresos', () => {
    expect(calculateSavings(200000, 80000, 50000)).toBe(70000);
  });

  it('puede dar negativo si se gasta más de lo que se ingresa', () => {
    expect(calculateSavings(100000, 80000, 50000)).toBe(-30000);
  });
});

describe('calculateNetWorth', () => {
  it('suma el valor de todos los snapshots del mes', () => {
    expect(calculateNetWorth([{ value: 100000 }, { value: 50000 }, { value: -20000 }])).toBe(130000);
  });

  it('devuelve 0 sin activos', () => {
    expect(calculateNetWorth([])).toBe(0);
  });
});

describe('calculateNetWorthDelta', () => {
  it('calcula la diferencia respecto al mes anterior', () => {
    expect(calculateNetWorthDelta(150000, 130000)).toBe(20000);
  });
});

describe('calculateSavingsRate', () => {
  it('calcula el ratio ahorro/ingresos', () => {
    expect(calculateSavingsRate(70000, 200000)).toBeCloseTo(0.35);
  });

  it('devuelve 0 si no hay ingresos, sin dividir entre cero', () => {
    expect(calculateSavingsRate(0, 0)).toBe(0);
  });
});

describe('calculateDeviation', () => {
  it('es 0 cuando el patrimonio varía justo lo ahorrado', () => {
    expect(calculateDeviation(70000, 70000)).toBe(0);
  });

  it('es negativa cuando el patrimonio ha ido peor de lo esperado', () => {
    expect(calculateDeviation(40000, 70000)).toBe(-30000);
  });

  it('es positiva cuando el patrimonio ha ido mejor de lo esperado', () => {
    expect(calculateDeviation(90000, 70000)).toBe(20000);
  });
});
