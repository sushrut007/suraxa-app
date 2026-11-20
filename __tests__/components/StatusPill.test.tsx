import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusPill } from '../../src/components/StatusPill';

describe('StatusPill Component', () => {
  it('renders online status correctly with default label', async () => {
    const { getByTestId, getByText } = await render(<StatusPill status="online" />);

    const pill = getByTestId('status-pill');
    expect(pill).toBeTruthy();
    expect(getByText('ONLINE')).toBeTruthy();
  });

  it('renders offline status correctly with default label', async () => {
    const { getByText } = await render(<StatusPill status="offline" />);
    expect(getByText('OFFLINE')).toBeTruthy();
  });

  it('renders fault status correctly with default label', async () => {
    const { getByText } = await render(<StatusPill status="fault" />);
    expect(getByText('FAULT')).toBeTruthy();
  });

  it('renders with custom label when provided', async () => {
    const { getByText } = await render(<StatusPill status="online" label="ACTIVE DISINFECTION" />);
    expect(getByText('ACTIVE DISINFECTION')).toBeTruthy();
  });

  it('renders small size variant with custom testID', async () => {
    const { getByTestId } = await render(
      <StatusPill status="fault" size="small" testID="custom-status" />
    );
    expect(getByTestId('custom-status')).toBeTruthy();
    expect(getByTestId('custom-status-dot')).toBeTruthy();
    expect(getByTestId('custom-status-label')).toBeTruthy();
  });
});
