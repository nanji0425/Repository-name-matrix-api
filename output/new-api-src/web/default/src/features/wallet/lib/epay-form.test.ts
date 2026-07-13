/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import {
  closePaymentTab,
  openPaymentTab,
  submitReturnedEpayForm,
} from './epay-form.ts'

type MockElement = {
  action: string
  method: string
  target: string
  type: string
  name: string
  value: string
  children: MockElement[]
  appendChild: (child: MockElement) => void
  submit: () => void
}

type MockWindow = {
  closed: boolean
  name: string
  document: {
    createElement: () => MockElement
    body: {
      appendChild: () => void
      removeChild: (form: MockElement) => void
    }
  }
  location: { href: string }
  close: () => void
}

const originalDocument = globalThis.document
const originalNavigator = globalThis.navigator
const originalWindow = globalThis.window

afterEach(() => {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: originalDocument,
  })
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: originalNavigator,
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  })
})

test('opens a named payment tab before the async request and submits into it', () => {
  let submittedForm: MockElement | undefined
  let removedForm: MockElement | undefined
  let createdBy = ''
  let openedTarget = ''
  let openedWindow: MockWindow | undefined

  const createElement = (owner: string): MockElement => {
    createdBy = owner
    const element: MockElement = {
      action: '',
      method: '',
      target: '',
      type: '',
      name: '',
      value: '',
      children: [],
      appendChild: () => {},
      submit: () => {},
    }
    element.appendChild = (child) => element.children.push(child)
    element.submit = () => {
      submittedForm = element
    }
    return element
  }

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { userAgent: 'Unit Test Chrome' },
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      open: (_url: string, target: string) => {
        openedTarget = target
        openedWindow = {
          closed: false,
          name: target,
          document: {
            createElement: () => createElement('popup'),
            body: {
              appendChild() {},
              removeChild(form: MockElement) {
                removedForm = form
              },
            },
          },
          close: () => {
            if (openedWindow) openedWindow.closed = true
          },
        }
        return openedWindow
      },
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => createElement('opener'),
      body: {
        appendChild() {},
        removeChild(form: MockElement) {
          removedForm = form
        },
      },
    },
  })

  const paymentTab = openPaymentTab()
  assert.ok(paymentTab)
  assert.equal(openedTarget, paymentTab.target)
  assert.equal(paymentTab.window, openedWindow)
  assert.ok(paymentTab.window?.document)

  const submitted = submitReturnedEpayForm({
    url: 'https://gateway.example/submit.php',
    data: {
      type: 'alipay',
      notify_url: 'https://matrixapi.online/api/user/epay/notify',
      return_url: 'https://matrixapi.online/console/log',
      out_trade_no: 'UNIT-TEST-NO-ORDER',
      sign: 'unit-test-signature',
    },
  }, paymentTab.target, paymentTab.window)

  assert.equal(submitted, true)
  assert.ok(submittedForm)
  assert.equal(submittedForm.action, 'https://gateway.example/submit.php')
  assert.equal(submittedForm.method, 'POST')
  assert.equal(submittedForm.target, paymentTab.target)
  assert.equal(createdBy, 'opener')
  assert.equal(removedForm, submittedForm)
  assert.deepEqual(
    Object.fromEntries(
      submittedForm.children.map((input) => [input.name, input.value])
    ),
    {
      type: 'alipay',
      notify_url: 'https://matrixapi.online/api/user/epay/notify',
      return_url: 'https://matrixapi.online/console/log',
      out_trade_no: 'UNIT-TEST-NO-ORDER',
      sign: 'unit-test-signature',
    }
  )

  closePaymentTab(paymentTab)
  assert.equal(openedWindow?.closed, true)
})

test('navigates a delayed ZPay tab with a GET query', () => {
  const openedWindow = {
    closed: false,
    name: 'zpay-target',
    location: { href: 'about:blank' },
    document: {
      createElement: () => {
        throw new Error('ZPay should not create a cross-document form')
      },
      body: { appendChild() {}, removeChild() {} },
    },
    close() {},
  } as unknown as MockWindow

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { open: () => openedWindow },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      baseURI: 'https://matrixapi.online/wallet',
      createElement: () => ({
        appendChild() {},
        submit() {},
      }),
      body: { appendChild() {}, removeChild() {} },
    },
  })

  const paymentTab = openPaymentTab()
  submitReturnedEpayForm(
    {
      url: 'https://zpayz.cn/submit.php',
      data: { type: 'alipay', money: '1.00' },
    },
    paymentTab.target,
    paymentTab.window
  )

  assert.match(openedWindow.location.href, /^https:\/\/zpayz\.cn\/submit\.php\?/) 
  assert.match(openedWindow.location.href, /type=alipay/)
  assert.match(openedWindow.location.href, /money=1\.00/)
})
