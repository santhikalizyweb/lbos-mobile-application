import { describe, expect, jest, test } from '@jest/globals';
import { date, label, money, stripHtml } from '../src/utils/format';
import { normalizeBaseUrl } from '../src/api/client';
import { readPage } from '../src/hooks/useApi';

jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ addListener: () => () => {} }) }));

describe('format', () => {
  test('money uses Indian digit grouping', () => {
    expect(money(1234567.5)).toBe('₹12,34,567.50');
    expect(money('999')).toBe('₹999');
    expect(money(null)).toBe('₹0');
    expect(money(-1500)).toBe('-₹1,500');
  });

  test('date treats plain dates as calendar days', () => {
    expect(date('2026-10-18')).toBe('18 Oct 2026');
    expect(date(null)).toBe('—');
  });

  test('label humanises status slugs', () => {
    expect(label('ready_to_ship')).toBe('Ready To Ship');
    expect(label('content-editor')).toBe('Content Editor');
  });

  test('stripHtml keeps line breaks and bullets', () => {
    expect(stripHtml('<p>Hello&nbsp;<b>world</b></p><ul><li>One</li></ul>')).toBe('Hello world\n• One');
  });
});

describe('normalizeBaseUrl', () => {
  test('adds a scheme and drops trailing /api', () => {
    expect(normalizeBaseUrl('192.168.1.5:8000/')).toBe('http://192.168.1.5:8000');
    expect(normalizeBaseUrl(' https://api.example.com/api ')).toBe('https://api.example.com');
  });
});

describe('readPage', () => {
  test('reads the Laravel paginator, API resources and custom meta', () => {
    expect(readPage({ data: [1], last_page: 3 }).lastPage).toBe(3);
    expect(readPage({ data: [1], meta: { last_page: 2 } }).lastPage).toBe(2);
    expect(readPage([1, 2]).items).toEqual([1, 2]);
  });
});
