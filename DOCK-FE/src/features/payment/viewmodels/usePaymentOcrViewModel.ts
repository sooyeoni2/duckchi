import React from 'react';
import { pickReceiptImage } from '../models/paymentImagePicker';
import {
  getExistingOcrDraft,
  recognizeReceiptImage,
} from '../models/paymentOcrService';
import type {
  OcrAssignMode,
  OcrFailureType,
  OcrImageSource,
  OcrItemQuantityAllocation,
  OcrLineItemDraft,
  OcrReceiptDraft,
  OcrReceiptSummary,
} from '../models/paymentTypes';

export type PaymentOcrState =
  | { status: 'idle' }
  | { status: 'processing' }
  | { status: 'loaded'; draft: OcrReceiptDraft }
  | { status: 'failure'; failureType: OcrFailureType; summary?: OcrReceiptSummary }
  | { status: 'error'; message: string };

export type PaymentOcrAssignSheetState =
  | { status: 'closed' }
  | {
      status: 'open';
      itemId: number;
      mode: OcrAssignMode;
      participantUserIds: number[];
      quantityAllocations: OcrItemQuantityAllocation[];
    };

const parseAmount = (text: string): number => {
  const digitsOnly = text.replace(/[^0-9]/g, '');
  return digitsOnly.length > 0 ? Number(digitsOnly) : 0;
};

const parseQuantity = (text: string): number => {
  const digitsOnly = text.replace(/[^0-9]/g, '');
  return digitsOnly.length > 0 ? Math.max(Number(digitsOnly), 1) : 1;
};

const recomputeLineItem = (item: OcrLineItemDraft): OcrLineItemDraft => ({
  ...item,
  quantity: Math.max(item.quantity, 1),
  unitPrice: Math.max(item.unitPrice, 0),
  amount: Math.max(item.quantity, 1) * Math.max(item.unitPrice, 0),
});

const syncTotals = (draft: OcrReceiptDraft): OcrReceiptDraft => {
  const items = draft.items.map(recomputeLineItem);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    ...draft,
    items,
    totalAmount,
  };
};

const applyTotalSplitPreview = (draft: OcrReceiptDraft): OcrReceiptDraft => {
  const selectedParticipants = draft.participants.filter(
    (participant) => participant.isSelected,
  );

  if (selectedParticipants.length === 0) {
    return {
      ...draft,
      participants: draft.participants.map((participant) => ({
        ...participant,
        splitAmount: 0,
      })),
    };
  }

  const baseAmount = Math.floor(draft.totalAmount / selectedParticipants.length);
  let remainingAmount = draft.totalAmount % selectedParticipants.length;

  return {
    ...draft,
    participants: draft.participants.map((participant) => {
      if (!participant.isSelected) {
        return {
          ...participant,
          splitAmount: 0,
        };
      }

      const bonusAmount = remainingAmount > 0 ? 1 : 0;
      remainingAmount = Math.max(remainingAmount - 1, 0);

      return {
        ...participant,
        splitAmount: baseAmount + bonusAmount,
      };
    }),
  };
};

const normalizeDraft = (draft: OcrReceiptDraft): OcrReceiptDraft =>
  draft.splitMode === 'TOTAL'
    ? applyTotalSplitPreview(syncTotals(draft))
    : syncTotals({
        ...draft,
        participants: draft.participants.map((participant) => ({
          ...participant,
          splitAmount: 0,
        })),
      });

function createEmptyQuantityAllocations(
  draft: OcrReceiptDraft,
): OcrItemQuantityAllocation[] {
  return draft.participants
    .filter((participant) => participant.isSelected)
    .map((participant) => ({
      userId: participant.userId,
      quantity: 0,
    }));
}

export function usePaymentOcrViewModel(roomId: number) {
  const [state, setState] = React.useState<PaymentOcrState>({
    status: 'idle',
  });
  const [assignSheetState, setAssignSheetState] =
    React.useState<PaymentOcrAssignSheetState>({
      status: 'closed',
    });

  React.useEffect(() => {
    setState({ status: 'idle' });
    setAssignSheetState({ status: 'closed' });
  }, [roomId]);

  const resetState = React.useCallback(() => {
    setState({ status: 'idle' });
    setAssignSheetState({ status: 'closed' });
  }, []);

  const scanReceipt = React.useCallback(
    async (source: OcrImageSource): Promise<'loaded' | 'failed' | 'cancelled'> => {
      try {
        const image = await pickReceiptImage(source);

        if (image == null) {
          return 'cancelled';
        }

        setState({ status: 'processing' });
        setAssignSheetState({ status: 'closed' });

        const result = await recognizeReceiptImage(roomId, image.uri, source);

        if (result.kind === 'SUCCESS') {
          setState({
            status: 'loaded',
            draft: normalizeDraft(result.draft),
          });
          return 'loaded';
        }

        if (result.kind === 'ITEMS_UNREADABLE') {
          setState({
            status: 'failure',
            failureType: 'ITEMS_UNREADABLE',
            summary: result.summary,
          });
          return 'failed';
        }

        setState({
          status: 'failure',
          failureType: 'RECEIPT_UNREADABLE',
        });
        return 'failed';
      } catch (error) {
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : '영수증 이미지를 불러오지 못했습니다.',
        });
        return 'failed';
      }
    },
    [roomId],
  );

  const loadExistingDraft = React.useCallback(
    async (expenseId: number): Promise<boolean> => {
      setState({ status: 'processing' });
      setAssignSheetState({ status: 'closed' });

      try {
        const draft = await getExistingOcrDraft(roomId, expenseId);
        setState({
          status: 'loaded',
          draft: normalizeDraft(draft),
        });
        return true;
      } catch (error) {
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'OCR 정산 초안을 불러오지 못했습니다.',
        });
        return false;
      }
    },
    [roomId],
  );

  const fallbackToTotalOnly = React.useCallback(() => {
    setState((previousState) => {
      if (
        previousState.status !== 'failure' ||
        previousState.failureType !== 'ITEMS_UNREADABLE' ||
        previousState.summary == null
      ) {
        return previousState;
      }

      return {
        status: 'loaded',
        draft: normalizeDraft({
          ...previousState.summary,
          splitMode: 'TOTAL',
          items: [],
          participants: [
            {
              userId: 1,
              userName: '박성환',
              isSelected: true,
              isMe: false,
              splitAmount: 0,
            },
            {
              userId: 2,
              userName: '정우주',
              isSelected: true,
              isMe: false,
              splitAmount: 0,
            },
            {
              userId: 3,
              userName: '류병선 (나)',
              isSelected: true,
              isMe: true,
              splitAmount: 0,
            },
            {
              userId: 4,
              userName: '김수연',
              isSelected: false,
              isMe: false,
              splitAmount: 0,
            },
          ],
        }),
      };
    });
  }, []);

  const updateLineItemName = React.useCallback((itemId: number, name: string) => {
    setState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      return {
        status: 'loaded',
        draft: normalizeDraft({
          ...previousState.draft,
          items: previousState.draft.items.map((item) =>
            item.itemId === itemId
              ? {
                  ...item,
                  name,
                }
              : item,
          ),
        }),
      };
    });
  }, []);

  const updateLineItemUnitPrice = React.useCallback(
    (itemId: number, text: string) => {
      setState((previousState) => {
        if (previousState.status !== 'loaded') {
          return previousState;
        }

        return {
          status: 'loaded',
          draft: normalizeDraft({
            ...previousState.draft,
            items: previousState.draft.items.map((item) =>
              item.itemId === itemId
                ? {
                    ...item,
                    unitPrice: parseAmount(text),
                  }
                : item,
            ),
          }),
        };
      });
    },
    [],
  );

  const updateLineItemQuantity = React.useCallback((itemId: number, text: string) => {
    setState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      return {
        status: 'loaded',
        draft: normalizeDraft({
          ...previousState.draft,
          items: previousState.draft.items.map((item) =>
            item.itemId === itemId
              ? {
                  ...item,
                  quantity: parseQuantity(text),
                }
              : item,
          ),
        }),
      };
    });
  }, []);

  const addLineItem = React.useCallback(() => {
    setState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      const nextItemId =
        previousState.draft.items.reduce(
          (maxItemId, item) => Math.max(maxItemId, item.itemId),
          0,
        ) + 1;

      return {
        status: 'loaded',
        draft: normalizeDraft({
          ...previousState.draft,
          items: [
            ...previousState.draft.items,
            {
              itemId: nextItemId,
              name: '',
              unitPrice: 0,
              quantity: 1,
              amount: 0,
              assignment: null,
            },
          ],
        }),
      };
    });
  }, []);

  const setSplitMode = React.useCallback((splitMode: OcrReceiptDraft['splitMode']) => {
    setState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      return {
        status: 'loaded',
        draft: normalizeDraft({
          ...previousState.draft,
          splitMode,
        }),
      };
    });
  }, []);

  const toggleParticipant = React.useCallback((userId: number) => {
    setState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      const nextDraft = {
        ...previousState.draft,
        participants: previousState.draft.participants.map((participant) =>
          participant.userId === userId
            ? {
                ...participant,
                isSelected: !participant.isSelected,
              }
            : participant,
        ),
      };

      const selectedUserIds = nextDraft.participants
        .filter((participant) => participant.isSelected)
        .map((participant) => participant.userId);

      const nextItems =
        nextDraft.splitMode === 'ITEM'
          ? nextDraft.items.map((item) => {
              if (item.assignment == null) {
                return item;
              }

              return {
                ...item,
                assignment: {
                  ...item.assignment,
                  participantUserIds: item.assignment.participantUserIds.filter((id) =>
                    selectedUserIds.includes(id),
                  ),
                  quantityAllocations: item.assignment.quantityAllocations?.filter(
                    (allocation) => selectedUserIds.includes(allocation.userId),
                  ) ?? [],
                },
              };
            })
          : nextDraft.items;

      return {
        status: 'loaded',
        draft: normalizeDraft({
          ...nextDraft,
          items: nextItems,
        }),
      };
    });
  }, []);

  const openAssignSheet = React.useCallback((itemId: number) => {
    setState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      const item = previousState.draft.items.find((candidate) => candidate.itemId === itemId);

      if (item == null) {
        return previousState;
      }

      setAssignSheetState({
        status: 'open',
        itemId,
        mode: item.assignment?.mode ?? 'PERSON',
        participantUserIds: item.assignment?.participantUserIds ?? [],
        quantityAllocations:
          item.assignment?.quantityAllocations ?? createEmptyQuantityAllocations(previousState.draft),
      });

      return previousState;
    });
  }, []);

  const closeAssignSheet = React.useCallback(() => {
    setAssignSheetState({ status: 'closed' });
  }, []);

  const setAssignMode = React.useCallback((mode: OcrAssignMode) => {
    setAssignSheetState((previousState) => {
      if (previousState.status !== 'open') {
        return previousState;
      }

      return {
        ...previousState,
        mode,
      };
    });
  }, []);

  const toggleAssignParticipant = React.useCallback((userId: number) => {
    setAssignSheetState((previousState) => {
      if (previousState.status !== 'open') {
        return previousState;
      }

      const hasUser = previousState.participantUserIds.includes(userId);

      return {
        ...previousState,
        participantUserIds: hasUser
          ? previousState.participantUserIds.filter((currentId) => currentId !== userId)
          : [...previousState.participantUserIds, userId],
      };
    });
  }, []);

  const updateAssignQuantity = React.useCallback(
    (userId: number, delta: number) => {
      setAssignSheetState((previousState) => {
        if (previousState.status !== 'open') {
          return previousState;
        }

        return {
          ...previousState,
          quantityAllocations: previousState.quantityAllocations.map((allocation) =>
            allocation.userId === userId
              ? {
                  ...allocation,
                  quantity: Math.max(allocation.quantity + delta, 0),
                }
              : allocation,
          ),
        };
      });
    },
    [],
  );

  const confirmAssignSheet = React.useCallback((): boolean => {
    if (assignSheetState.status !== 'open') {
      return false;
    }

    let confirmed = false;

    setState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      const targetItem = previousState.draft.items.find(
        (candidate) => candidate.itemId === assignSheetState.itemId,
      );

      if (targetItem == null) {
        return previousState;
      }

      if (
        assignSheetState.mode === 'PERSON' &&
        assignSheetState.participantUserIds.length === 0
      ) {
        return previousState;
      }

      if (assignSheetState.mode === 'QUANTITY') {
        const assignedQuantity = assignSheetState.quantityAllocations.reduce(
          (sum, allocation) => sum + allocation.quantity,
          0,
        );

        if (assignedQuantity !== targetItem.quantity) {
          return previousState;
        }
      }

      confirmed = true;

      return {
        status: 'loaded',
        draft: normalizeDraft({
          ...previousState.draft,
          items: previousState.draft.items.map((item) =>
            item.itemId === assignSheetState.itemId
              ? {
                  ...item,
                  assignment: {
                    mode: assignSheetState.mode,
                    participantUserIds:
                      (assignSheetState.mode === 'PERSON' || assignSheetState.mode === 'MANUAL_SPLIT')
                        ? assignSheetState.participantUserIds
                        : assignSheetState.quantityAllocations
                            .filter((allocation) => allocation.quantity > 0)
                            .map((allocation) => allocation.userId),
                    quantityAllocations:
                      (assignSheetState.mode === 'QUANTITY' || assignSheetState.mode === 'QUANTITY_SPLIT')
                        ? assignSheetState.quantityAllocations
                        : [],
                  },
                }
              : item,
          ),
        }),
      };
    });

    if (confirmed) {
      setAssignSheetState({ status: 'closed' });
    }

    return confirmed;
  }, [assignSheetState]);

  const clearItemAssignment = React.useCallback((itemId: number) => {
    setState((previousState) => {
      if (previousState.status !== 'loaded') {
        return previousState;
      }

      return {
        status: 'loaded',
        draft: normalizeDraft({
          ...previousState.draft,
          items: previousState.draft.items.map((item) =>
            item.itemId === itemId
              ? {
                  ...item,
                  assignment: null,
                }
              : item,
          ),
        }),
      };
    });
  }, []);

  const draft = state.status === 'loaded' ? state.draft : null;
  const selectedParticipants =
    draft?.participants.filter((participant) => participant.isSelected) ?? [];
  const selectedParticipantCount = selectedParticipants.length;
  const perPersonAmount =
    selectedParticipantCount > 0
      ? Math.floor((draft?.totalAmount ?? 0) / selectedParticipantCount)
      : 0;
  const unassignedItems =
    draft?.items.filter((item) => item.assignment == null) ?? [];
  const assignedItems =
    draft?.items.filter((item) => item.assignment != null) ?? [];
  const remainingUnassignedAmount = unassignedItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const assignTargetItem =
    draft != null && assignSheetState.status === 'open'
      ? draft.items.find((item) => item.itemId === assignSheetState.itemId) ?? null
      : null;

  return {
    state,
    draft,
    assignSheetState,
    selectedParticipants,
    selectedParticipantCount,
    perPersonAmount,
    unassignedItems,
    assignedItems,
    remainingUnassignedAmount,
    assignTargetItem,
    resetState,
    scanReceipt,
    loadExistingDraft,
    fallbackToTotalOnly,
    updateLineItemName,
    updateLineItemUnitPrice,
    updateLineItemQuantity,
    addLineItem,
    setSplitMode,
    toggleParticipant,
    openAssignSheet,
    closeAssignSheet,
    setAssignMode,
    toggleAssignParticipant,
    updateAssignQuantity,
    confirmAssignSheet,
    clearItemAssignment,
  };
}
