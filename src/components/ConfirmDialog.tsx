import React, { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { PrimaryButton } from './PrimaryButton';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isHazard?: boolean;
  loading?: boolean;
  testID?: string;
}

export const ConfirmDialog = memo<ConfirmDialogProps>(function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isHazard = false,
  loading = false,
  testID = 'confirm-dialog',
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
      testID={testID}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropPressable}
          onPress={loading ? undefined : onCancel}
          accessibilityLabel="Close confirmation modal"
          accessibilityRole="button"
          testID={`${testID}-backdrop`}
        />
        <View
          testID={`${testID}-content`}
          style={[
            styles.dialogContainer,
            {
              backgroundColor: colors.cardElevated,
              borderColor: isHazard ? colors.danger : colors.cardBorder,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
            },
          ]}
        >
          {isHazard ? (
            <View
              testID={`${testID}-hazard-badge`}
              style={[
                styles.hazardIconContainer,
                {
                  backgroundColor: colors.dangerLight,
                  borderRadius: borderRadius.pill,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <Text style={[styles.hazardIconText, { color: colors.danger }]}>⚠️ UV-C SAFETY</Text>
            </View>
          ) : null}

          <Text
            testID={`${testID}-title`}
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                fontSize: typography.h2.fontSize,
                lineHeight: typography.h2.lineHeight,
                fontWeight: typography.h2.fontWeight,
                marginBottom: spacing.xs,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            testID={`${testID}-message`}
            style={[
              styles.message,
              {
                color: colors.textSecondary,
                fontSize: typography.bodyMedium.fontSize,
                lineHeight: typography.bodyMedium.lineHeight,
                marginBottom: spacing.xl,
              },
            ]}
          >
            {message}
          </Text>

          <View style={styles.buttonRow}>
            <PrimaryButton
              testID={`${testID}-cancel`}
              title={cancelText}
              variant="outline"
              disabled={loading}
              onPress={onCancel}
              style={[styles.button, { marginRight: spacing.sm }]}
            />
            <PrimaryButton
              testID={`${testID}-confirm`}
              title={confirmText}
              variant={isHazard ? 'danger' : 'primary'}
              loading={loading}
              onPress={onConfirm}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  hazardIconContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hazardIconText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {},
  message: {},
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    flex: 1,
  },
});
