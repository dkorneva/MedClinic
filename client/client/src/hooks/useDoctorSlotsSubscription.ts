import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { HUB_URLS } from '../shared/config/env';
import { tokenStorage } from '../shared/lib/auth/tokenStorage';

interface UseDoctorSlotsSubscriptionOptions {
  doctorId: number | null;
  onSlotsUpdated?: (updatedDoctorId: number) => void;
  enabled?: boolean;
}

export function useDoctorSlotsSubscription({
  doctorId,
  onSlotsUpdated,
  enabled = true,
}: UseDoctorSlotsSubscriptionOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!enabled || !doctorId) {
      return;
    }

    if (!connectionRef.current) {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URLS.doctorSlots, {
          accessTokenFactory: () => tokenStorage.get() || '',
        })
        .withAutomaticReconnect()
        .build();

      connection.on('SlotsUpdated', (updatedDoctorId: number) => {
        if (updatedDoctorId === doctorId && onSlotsUpdated) {
          onSlotsUpdated(updatedDoctorId);
        }
      });

      connection.start().catch((error) => {
        console.error('SignalR connection error:', error);
      });

      connectionRef.current = connection;
    }

    const connection = connectionRef.current;

    const subscribeToSlots = async () => {
      try {
        await connection.invoke('SubscribeToDoctorSlots', doctorId);
      } catch (error) {
        console.error('Error subscribing to doctor slots:', error);
      }
    };

    if (connection.state === signalR.HubConnectionState.Connected) {
      subscribeToSlots();
    } else {
      connection.onreconnected(subscribeToSlots);
    }

    return () => {
      const unsubscribeFromSlots = async () => {
        try {
          await connection.invoke('UnsubscribeFromDoctorSlots', doctorId);
        } catch (error) {
          console.error('Error unsubscribing from doctor slots:', error);
        }
      };

      if (connection.state === signalR.HubConnectionState.Connected) {
        unsubscribeFromSlots();
      }
    };
  }, [doctorId, onSlotsUpdated, enabled]);

  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch((error) => {
          console.error('Error stopping SignalR connection:', error);
        });
        connectionRef.current = null;
      }
    };
  }, []);
}
