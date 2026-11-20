import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('renders dialog elements when visible', async () => {
    const onConfirmMock = jest.fn();
    const onCancelMock = jest.fn();

    const { getByTestId, getByText } = await render(
      <ConfirmDialog
        visible={true}
        title="Confirm UV-C Relay ON"
        message="UV-C is harmful to eyes and skin."
        confirmText="Yes, Turn ON"
        cancelText="Abort"
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
        isHazard
      />
    );

    expect(getByTestId('confirm-dialog')).toBeTruthy();
    expect(getByText('Confirm UV-C Relay ON')).toBeTruthy();
    expect(getByText('UV-C is harmful to eyes and skin.')).toBeTruthy();
    expect(getByText('Yes, Turn ON')).toBeTruthy();
    expect(getByText('Abort')).toBeTruthy();
    expect(getByTestId('confirm-dialog-hazard-badge')).toBeTruthy();
  });

  it('calls onConfirm when confirm button is pressed', async () => {
    const onConfirmMock = jest.fn();
    const onCancelMock = jest.fn();

    const { getByTestId } = await render(
      <ConfirmDialog
        visible={true}
        title="Test Action"
        message="Please confirm action"
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
      />
    );

    fireEvent.press(getByTestId('confirm-dialog-confirm'));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onCancelMock).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is pressed', async () => {
    const onConfirmMock = jest.fn();
    const onCancelMock = jest.fn();

    const { getByTestId } = await render(
      <ConfirmDialog
        visible={true}
        title="Test Action"
        message="Please confirm action"
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
      />
    );

    fireEvent.press(getByTestId('confirm-dialog-cancel'));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).not.toHaveBeenCalled();
  });

  it('does not render hazard badge when isHazard is false', async () => {
    const { queryByTestId } = await render(
      <ConfirmDialog
        visible={true}
        title="Standard Action"
        message="Confirm safe operation"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isHazard={false}
      />
    );

    expect(queryByTestId('confirm-dialog-hazard-badge')).toBeNull();
  });
});
