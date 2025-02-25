import React, {
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  useEffect,
  ///: END:ONLY_INCLUDE_IN
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/snaps-rpc-methods';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexWrap,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import SnapAuthorshipExpanded from '../../../components/app/snaps/snap-authorship-expanded';
import SnapRemoveWarning from '../../../components/app/snaps/snap-remove-warning';
import ConnectedSitesList from '../../../components/app/connected-sites-list';
///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
import KeyringSnapRemovalWarning from '../../../components/app/snaps/keyring-snap-removal-warning';
///: END:ONLY_INCLUDE_IN
import {
  removeSnap,
  removePermissionsFor,
  updateCaveat,
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  showKeyringSnapRemovalModal,
  getSnapAccountsById,
  ///: END:ONLY_INCLUDE_IN
} from '../../../store/actions';
import {
  getSnaps,
  getSubjectsWithSnapPermission,
  getPermissions,
  getPermissionSubjects,
  getTargetSubjectMetadata,
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  getMemoizedMetaMaskIdentities,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import { getSnapName } from '../../../helpers/utils/util';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import SnapPermissionsList from '../../../components/app/snaps/snap-permissions-list';
import { SnapDelineator } from '../../../components/app/snaps/snap-delineator';
import { DelineatorType } from '../../../helpers/constants/snaps';
import { ShowMore } from '../../../components/app/snaps/show-more';
///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
import { KeyringSnapRemovalResultStatus } from './constants';
///: END:ONLY_INCLUDE_IN

function SnapSettings({ snapId }) {
  const t = useI18nContext();

  const snaps = useSelector(getSnaps);
  const snap = Object.entries(snaps)
    .map(([_, snapState]) => snapState)
    .find((snapState) => snapState.id === snapId);

  const [isShowingRemoveWarning, setIsShowingRemoveWarning] = useState(false);
  // eslint-disable-next-line no-unused-vars -- Main build does not use setIsRemovingKeyringSnap
  const [isRemovingKeyringSnap, setIsRemovingKeyringSnap] = useState(false);

  // eslint-disable-next-line no-unused-vars -- Main build does not use setKeyringAccounts
  const [keyringAccounts, setKeyringAccounts] = useState([]);
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  const identities = useSelector(getMemoizedMetaMaskIdentities);
  ///: END:ONLY_INCLUDE_IN

  const connectedSubjects = useSelector((state) =>
    getSubjectsWithSnapPermission(state, snap?.id),
  );
  const permissions = useSelector(
    (state) => snap && getPermissions(state, snap.id),
  );
  const subjects = useSelector((state) => getPermissionSubjects(state));
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snap?.id),
  );

  let isKeyringSnap = false;
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  isKeyringSnap = Boolean(subjects[snap?.id]?.permissions?.snap_manageAccounts);

  useEffect(() => {
    if (isKeyringSnap) {
      (async () => {
        const addresses = await getSnapAccountsById(snap.id);
        const snapIdentities = Object.values(identities).filter((identity) =>
          addresses.includes(identity.address.toLowerCase()),
        );
        setKeyringAccounts(snapIdentities);
      })();
    }
  }, [snap?.id, identities, isKeyringSnap]);

  ///: END:ONLY_INCLUDE_IN

  const dispatch = useDispatch();

  const onDisconnect = (connectedOrigin) => {
    const caveatValue =
      subjects[connectedOrigin].permissions[WALLET_SNAP_PERMISSION_KEY]
        .caveats[0].value;
    const newCaveatValue = { ...caveatValue };
    delete newCaveatValue[snapId];
    if (Object.keys(newCaveatValue).length > 0) {
      dispatch(
        updateCaveat(
          connectedOrigin,
          WALLET_SNAP_PERMISSION_KEY,
          SnapCaveatType.SnapIds,
          newCaveatValue,
        ),
      );
    } else {
      dispatch(
        removePermissionsFor({
          [connectedOrigin]: [WALLET_SNAP_PERMISSION_KEY],
        }),
      );
    }
  };

  const snapName = getSnapName(snap.id, targetSubjectMetadata);

  return (
    <Box>
      <SnapAuthorshipExpanded snapId={snap.id} snap={snap} />
      <Box className="snap-view__content__description" marginTop={[4, 7]}>
        <SnapDelineator type={DelineatorType.Description} snapName={snapName}>
          <ShowMore buttonBackground={BackgroundColor.backgroundDefault}>
            <Text>{snap?.manifest.description}</Text>
          </ShowMore>
        </SnapDelineator>
      </Box>
      <Box className="snap-view__content__permissions" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium}>{t('permissions')}</Text>
        <SnapPermissionsList
          snapId={snapId}
          permissions={permissions ?? {}}
          targetSubjectMetadata={targetSubjectMetadata}
          showOptions
        />
      </Box>
      <Box className="snap-view__content__connected-sites" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={2}>
          {t('connectedSites')}
        </Text>
        <ConnectedSitesList
          connectedSubjects={connectedSubjects}
          onDisconnect={(origin) => {
            onDisconnect(origin, snap.id);
          }}
        />
      </Box>
      <Box className="snap-view__content__remove" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium} color={TextColor.textDefault}>
          {t('removeSnap')}
        </Text>
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {t('removeSnapDescription')}
        </Text>
        <Box
          marginTop={4}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
        >
          <Button
            className="snap-view__content__remove-button"
            danger="true"
            variant={ButtonVariant.Secondary}
            width={BlockSize.Full}
            size={ButtonSize.Lg}
            onClick={() => setIsShowingRemoveWarning(true)}
            data-testid="remove-snap-button"
          >
            <Text
              color={TextColor.inherit}
              variant={TextVariant.bodyMd}
              flexWrap={FlexWrap.NoWrap}
              ellipsis
              style={{ overflow: 'hidden' }}
              paddingTop={3}
              paddingBottom={3}
            >
              {`${t('remove')} ${snapName}`}
            </Text>
          </Button>
          <SnapRemoveWarning
            isOpen={
              isShowingRemoveWarning &&
              (!isKeyringSnap || keyringAccounts.length === 0) &&
              !isRemovingKeyringSnap
            }
            onCancel={() => setIsShowingRemoveWarning(false)}
            onSubmit={async () => {
              await dispatch(removeSnap(snap.id));
            }}
            snapName={snapName}
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
            <>
              <KeyringSnapRemovalWarning
                snap={snap}
                keyringAccounts={keyringAccounts}
                snapUrl={snap.url}
                onCancel={() => setIsShowingRemoveWarning(false)}
                onClose={() => setIsShowingRemoveWarning(false)}
                onBack={() => setIsShowingRemoveWarning(false)}
                onSubmit={async () => {
                  try {
                    setIsRemovingKeyringSnap(true);
                    await dispatch(removeSnap(snap.id));
                    setIsShowingRemoveWarning(false);
                    dispatch(
                      showKeyringSnapRemovalModal({
                        snapName,
                        result: KeyringSnapRemovalResultStatus.Success,
                      }),
                    );
                  } catch {
                    setIsShowingRemoveWarning(false);
                    dispatch(
                      showKeyringSnapRemovalModal({
                        snapName,
                        result: KeyringSnapRemovalResultStatus.Failed,
                      }),
                    );
                  } finally {
                    setIsRemovingKeyringSnap(false);
                  }
                }}
                isOpen={
                  isShowingRemoveWarning &&
                  isKeyringSnap &&
                  keyringAccounts.length > 0
                }
              />
            </>
            ///: END:ONLY_INCLUDE_IN
          }
        </Box>
      </Box>
    </Box>
  );
}

SnapSettings.propTypes = {
  snapId: PropTypes.string.isRequired,
};

export default SnapSettings;
