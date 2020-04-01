interface Callback {
    (success: boolean): void;
}

export abstract class OnComplete {
    private onCompleteCallbacks: Callback[] = [];

    onComplete(callback: Callback) {
        this.onCompleteCallbacks.push(callback);
    }

    protected completed(success: boolean) {
        this.onCompleteCallbacks.forEach(c => c(success));
    }
}