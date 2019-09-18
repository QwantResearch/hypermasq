import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withTranslation } from 'react-i18next'

import { getMasqInstance, signin, setSyncStep } from '../../actions'
import { SyncDevice } from '../../modals'
import SyncProfile from '../../lib/sync-profile'

class Sync extends Component {
  constructor (props) {
    super(props)
    this.state = {
      profile: { username: '', image: '' },
      errorPass: false,
      message: null
    }
    this.startSync = this.startSync.bind(this)
    this.authenticate = this.authenticate.bind(this)
    this.handlePasswordKeyUp = this.handlePasswordKeyUp.bind(this)
  }

  componentDidMount () {
    const { link, setSyncStep } = this.props
    let hash = ''
    try {
      setSyncStep('syncing')
      if (!link.length) throw new Error('invalid link')
      const url = new URL(link)
      if (url.hash.substring(0, 7) !== '#/sync/') return
      hash = url.hash.substr(7) // ignore #/sync/ characters
      if (!hash.length) throw new Error('invalid link')
      this.startSync(hash)
    } catch (e) {
      setSyncStep('error')
    }
  }

  async startSync (hash) {
    const { t } = this.props
    const decoded = Buffer.from(hash, 'base64')
    const sp = new SyncProfile()

    try {
      const [msg, channel, key] = JSON.parse(decoded)
      if (msg !== 'pullProfile') throw new Error('Unexpected message')
      await sp.init(channel, Buffer.from(key, 'base64'))
      await sp.joinSecureChannel()
      await sp.pullProfile()
      const masq = getMasqInstance()
      const profiles = await masq.getProfiles()
      const profile = profiles[profiles.length - 1]
      this.setState({ profile })
      this.props.setSyncStep('password')
    } catch (e) {
      this.setState({ message: 'error' })
      if (e.message === 'alreadySynced') {
        this.setState({ message: t('This profile is already synchronized on this device.') })
      }
    }
  }

  async authenticate (pass) {
    try {
      await this.props.signin(this.state.profile, pass)
      this.props.setSyncStep('finished')
    } catch (e) {
      this.setState({ errorPass: true })
    }
  }

  handlePasswordKeyUp (e) {
    if (e.key === 'Enter') {
      this.authenticate(this.state.pass)
    }
  }

  render () {
    const { message, profile, errorPass } = this.state
    const { onClose, syncStep } = this.props
    if (!syncStep || !syncStep.length) return null
    return syncStep === 'password'
      ? <SyncDevice step='password' error={errorPass} onClose={onClose} profile={profile} onClick={(pass) => this.authenticate(pass)} onKeyUp={this.handlePasswordKeyUp} />
      : <SyncDevice step={syncStep} message={message} onClick={onClose} />
  }
}

Sync.propTypes = {
  link: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  signin: PropTypes.func,
  setSyncStep: PropTypes.func.isRequired,
  syncStep: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired
}

const mapDispatchToProps = dispatch => ({
  signin: (user, passphrase) => dispatch(signin(user, passphrase)),
  setSyncStep: (step) => dispatch(setSyncStep(step))
})

const mapStateToProps = (state) => ({
  syncStep: state.masq.syncStep
})

const translatedSync = withTranslation()(Sync)
export default connect(mapStateToProps, mapDispatchToProps)(translatedSync)
