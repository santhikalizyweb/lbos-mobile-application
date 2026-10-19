import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Avatar, Badge, Button, Card, Field, KeyValue, Muted, Row, Screen, SectionTitle, Title } from '../../components/ui';
import { space } from '../../theme';
import { initials, label } from '../../utils/format';

export default function ProfileScreen() {
  const { session, serverUrl, updateUser, signOut } = useAuth();
  const oms = session?.users.oms;
  const [name, setName] = useState(oms?.name ?? '');
  const [phone, setPhone] = useState(oms?.task_phone ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('oms', '/profile')
      .then(p => {
        setName(p?.name ?? oms?.name ?? '');
        setPhone(p?.phone ?? p?.task_phone ?? '');
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const p = await api.put('oms', '/profile', { name: name.trim(), phone: phone.trim() || null });
      updateUser('oms', { name: p?.name ?? name.trim(), task_phone: p?.phone ?? phone.trim() });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const partnership = session?.users.partnership;
  const universal = session?.users.universal;

  return (
    <Screen>
      <Card>
        <Row>
          <Avatar text={initials(oms?.name)} size={56} />
          <Muted style={{ flex: 1, marginLeft: space.md }}>
            <Title style={{ fontSize: 18 }}>{oms?.name}</Title>
            {'\n'}
            {oms?.email}
          </Muted>
        </Row>
      </Card>

      <SectionTitle>Edit profile</SectionTitle>
      <Card>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Phone (for task SMS alerts)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button title="Save" onPress={save} loading={busy} disabled={!name.trim()} />
        <Muted style={{ marginTop: space.md, fontSize: 12 }}>Email and password are changed by an admin in OMS.</Muted>
      </Card>

      <SectionTitle>Access</SectionTitle>
      <Card>
        <KeyValue k="Account type" v={<Badge text={label(session?.accountType)} status="active" />} />
        <KeyValue k="OMS role" v={label(oms?.role)} />
        <KeyValue k="Partnership" v={partnership ? (partnership.roles ?? []).join(', ') || 'Signed in' : 'No access'} />
        <KeyValue k="Website admin" v={universal ? label(universal.role) || 'Signed in' : 'No access'} />
        <KeyValue k="Server" v={serverUrl} />
      </Card>

      <Button title="Sign out" variant="danger" onPress={() => signOut()} style={{ marginTop: space.lg }} />
    </Screen>
  );
}
