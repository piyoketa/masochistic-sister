export interface CardTagProps {
  id: string
  name: string
  description?: string
}

export class CardTag {
  private readonly props: CardTagProps

  constructor(props: CardTagProps) {
    this.props = props
  }

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }
}
