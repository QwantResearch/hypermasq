import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import QRCode from 'qrcode.react'
import { Copy } from 'react-feather'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import { connect } from 'react-redux'

import { Modal, Typography, Space, TextField } from '../../components'
import { SyncDevice } from '../../modals'
import SyncProfile from '../../lib/sync-profile'

import styles from './QRCodeModal.module.scss'

const Pill = ({ children }) => (
  <div className={styles.pill}>{children}</div>
)

Pill.propTypes = {
  children: PropTypes.string.isRequired
}

const QRCodeModal = ({ onClose }) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [link, setLink] = useState('')
  const [syncStep, setSyncStep] = useState(null)

  useEffect(() => {
    const startSync = async () => {
      const sp = new SyncProfile()
      await sp.init()
      const secureLink = await sp.getSecureLink()
      setLink(secureLink)
      await sp.joinSecureChannel()
      // Start Sync animation
      setSyncStep('syncing')
      await sp.pushProfile()
    }
    startSync()
  }, [])

  const copyLink = () => {
    const link = document.querySelector('#qrcode input')
    link.select()
    document.execCommand('copy')
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  if (syncStep) {
    return <SyncDevice step={syncStep} onClick={() => console.log('onClick')} />
  }

  return (
    <Modal width={300} padding={78} onClose={onClose}>
      <div id='qrcode' className={styles.QRCode}>
        <Typography type='title-modal'>{t('Add a device')}</Typography>
        <Space size={32} />
        <Typography maxWidth={320} type='paragraph-modal' align='center'>{t('Scan this QR Code with the device you want to synchronize:')}</Typography>
        <Space size={18} />
        <QRCode value={link} />
        <Space size={26} />
        <Typography line align='center' type='paragraph-modal' color={styles.colorBlueGrey}>{t('or')}</Typography>
        <Space size={22} />
        <Typography maxWidth={320} type='paragraph-modal' align='center'>{t('Copy the following link and paste it in the browser you want to use:')}</Typography>
        <Space size={24} />
        <TextField
          className={classNames(
            styles.input,
            { [styles.copied]: copied }
          )}
          readonly
          defaultValue={link}
          value={link}
          button={<Copy style={{ height: 40 }} />}
          height={36}
          onClick={() => copyLink()}
        />
        <Space size={8} />
        {copied && <Pill>{t('Link Copied !')}</Pill>}
        {!copied && <Space size={28} />}
        <Space size={16} />
      </div>
    </Modal>
  )
}

QRCodeModal.propTypes = {
  onClose: PropTypes.func
}

const mapStateToProps = (state) => ({
  user: state.masq.currentUser,
  devices: state.masq.devices
})

export default connect(mapStateToProps)(QRCodeModal)
