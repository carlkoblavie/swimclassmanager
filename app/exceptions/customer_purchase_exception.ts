import { Exception } from '@adonisjs/core/exceptions'

export default class CustomerPurchaseException extends Exception {
  static status = 400
  static code = 'E_CUSTOMER_PURCHASE'

  constructor(message = 'Unable to complete purchase.') {
    super(message)
  }
}
