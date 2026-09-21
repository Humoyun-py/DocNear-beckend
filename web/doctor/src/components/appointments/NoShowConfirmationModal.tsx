import React, { useState } from 'react';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useToastStore } from '../../store/useToastStore';

export const NoShowConfirmationModal: React.FC = () => {
  const { noShowTarget, setNoShowTarget, markNoShow } = useAppointmentStore();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!noShowTarget) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    await markNoShow(noShowTarget.id);
    addToast({
      type: 'warning',
      title: 'Patient Marked as No-Show',
      message: `${noShowTarget.patientName} has been flagged as absent for ${noShowTarget.time} appointment.`,
    });
    setIsLoading(false);
    setNoShowTarget(null);
  };

  return (
    <ConfirmationDialog
      isOpen={Boolean(noShowTarget)}
      onClose={() => setNoShowTarget(null)}
      onConfirm={handleConfirm}
      title="Mark Appointment as No-Show"
      description={`Are you sure you want to mark ${noShowTarget.patientName}'s appointment (${noShowTarget.bookingCode}) as no-show? This records patient absence in the clinical log.`}
      confirmLabel="Confirm No-Show"
      cancelLabel="Cancel"
      variant="warning"
      isLoading={isLoading}
    />
  );
};
